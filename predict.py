import json
import sys
from pathlib import Path
from typing import Any, cast

import torch
import torch.nn as nn

MODEL_PATH = Path("models/heart_attack_model.pt")
SCALER_PATH = Path("models/scaler.json")
LABELS = {0: "low risk", 1: "high risk"}

scaler = json.loads(SCALER_PATH.read_text(encoding="utf-8"))
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


def predict(payload: dict[str, Any]) -> dict[str, Any]:
    x = to_tensor(payload)
    with torch.no_grad():
        logits = model(x)
        probabilities = torch.softmax(logits, dim=1)
        predicted = int(probabilities.argmax(dim=1).item())
        confidence = probabilities[0, predicted].item()
    return {
        "prediction": predicted,
        "label": LABELS[predicted],
        "confidence": confidence,
        "input": {col: payload.get(col) for col in FEATURE_COLS},
    }


def payloads_from_file(path: str | Path) -> list[dict[str, Any]]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, list):
        return cast("list[dict[str, Any]]", data)
    if isinstance(data, dict) and "patients" in data:
        return cast("list[dict[str, Any]]", data["patients"])
    return [cast("dict[str, Any]", data)]


if len(sys.argv) == 1:
    patients_db = Path("examples/patients.json")
    if patients_db.exists():
        paths = [patients_db]
    else:
        paths = sorted(
            path
            for path in Path("examples").glob("*.json")
            if path.name != "patients.json"
        )
    if not paths:
        print("Usage: python predict.py path/to/patient.json")
        sys.exit(1)
    for path in paths:
        for payload in payloads_from_file(path):
            result = predict(payload)
            result["file"] = str(path)
            result["id"] = payload.get("id")
            result["name"] = payload.get("name")
            print(result)
else:
    patient_path = sys.argv[1]
    for payload in payloads_from_file(patient_path):
        result = predict(payload)
        result["file"] = patient_path
        result["id"] = payload.get("id")
        result["name"] = payload.get("name")
        print(result)

