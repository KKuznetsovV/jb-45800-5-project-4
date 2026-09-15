import json
import os
import time
from typing import Any, Union

import mysql.connector
import pika
import torch
import torch.nn as nn
from mysql.connector.abstracts import MySQLConnectionAbstract
from mysql.connector.pooling import PooledMySQLConnection
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties

MySQLConnectionType = Union[PooledMySQLConnection, MySQLConnectionAbstract]

MODEL_PATH = os.environ.get("MODEL_PATH", "models/heart_attack_model.pt")
SCALER_PATH = os.environ.get("SCALER_PATH", "models/scaler.json")
QUEUE_NAME = os.environ.get("QUEUE_NAME", "predictions")
LABELS = {0: "low risk", 1: "high risk"}

with open(SCALER_PATH, encoding="utf-8") as handle:
    scaler = json.load(handle)

FEATURE_COLS = scaler["feature_cols"]
medians = scaler["medians"]
mean = torch.tensor(scaler["mean"], dtype=torch.float32)
std = torch.tensor(scaler["std"], dtype=torch.float32)

model = nn.Sequential(
    nn.Linear(len(FEATURE_COLS), 64),
    nn.ReLU(),
    nn.Linear(64, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 2),
)
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()


def wait_for_db() -> MySQLConnectionType:
    while True:
        try:
            return mysql.connector.connect(
                host=os.environ.get("MYSQL_HOST", "127.0.0.1"),
                port=int(os.environ.get("MYSQL_PORT", "3306")),
                user=os.environ.get("MYSQL_USER", "root"),
                password=os.environ.get("MYSQL_PASSWORD", ""),
                database=os.environ.get("MYSQL_DATABASE", "heart"),
            )
        except mysql.connector.Error:
            time.sleep(1)


def wait_for_queue() -> BlockingChannel:
    while True:
        try:
            parameters = pika.URLParameters(
                os.environ.get("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672")
            )
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            channel.basic_qos(prefetch_count=1)
            return channel
        except Exception:
            time.sleep(1)


def to_tensor(payload: dict[str, Any]) -> torch.Tensor:
    values: list[float] = []
    for i, col in enumerate(FEATURE_COLS):
        value = payload.get(col)
        if value is None or value == "":
            values.append(float(medians[i]))
        else:
            values.append(float(value))
    x = torch.tensor(values, dtype=torch.float32)
    return ((x - mean) / std).unsqueeze(0)


def infer(payload: dict[str, Any]) -> tuple[str, float]:
    x = to_tensor(payload)
    with torch.no_grad():
        logits = model(x)
        probabilities = torch.softmax(logits, dim=1)
        predicted = int(probabilities.argmax(dim=1).item())
        confidence = probabilities[0, predicted].item()
    return LABELS[predicted], float(confidence)


def handle_message(
    channel: BlockingChannel,
    method: Basic.Deliver,
    _properties: BasicProperties,
    body: bytes,
) -> None:
    db = wait_for_db()
    cursor = db.cursor(dictionary=True)
    try:
        job: dict[str, Any] = json.loads(body.decode("utf-8"))
        prediction_id = job["id"]
        cursor.execute(
            "SELECT features_json FROM predictions WHERE id = %s",
            (prediction_id,),
        )
        row = cursor.fetchone()
        if row is None:
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return
        assert isinstance(row, dict)

        features = row["features_json"]
        if isinstance(features, str):
            features = json.loads(features)

        label, probability = infer(features)
        cursor.execute(
            """
            UPDATE predictions
            SET status = 'done', label = %s, probability = %s, error_message = NULL
            WHERE id = %s
            """,
            (label, probability, prediction_id),
        )
        db.commit()
        channel.basic_ack(delivery_tag=method.delivery_tag)
        print(f"prediction {prediction_id} -> {label} ({probability:.4f})")
    except Exception as error:
        db.rollback()
        try:
            cursor.execute(
                """
                UPDATE predictions
                SET status = 'error', error_message = %s
                WHERE id = %s
                """,
                (str(error)[:250], json.loads(body.decode("utf-8")).get("id")),
            )
            db.commit()
        except Exception:
            pass
        channel.basic_ack(delivery_tag=method.delivery_tag)
        print(f"prediction failed: {error}")
    finally:
        cursor.close()
        db.close()


print("waiting for mysql and rabbitmq")
wait_for_db().close()
channel = wait_for_queue()
print("worker ready")
channel.basic_consume(queue=QUEUE_NAME, on_message_callback=handle_message)
channel.start_consuming()
