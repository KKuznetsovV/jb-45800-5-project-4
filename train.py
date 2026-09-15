import csv
import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

DATA_PATH = Path("data/heart.csv")
MODEL_PATH = Path("models/heart_attack_model.pt")
SCALER_PATH = Path("models/scaler.json")
MODEL_PATH.parent.mkdir(exist_ok=True)

FEATURE_COLS = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
]

BATCH_SIZE = 16
EPOCHS = 75
LR = 0.001

torch.manual_seed(42)


def parse_cell(value: str | None) -> float | None:
    if value is None or value.strip() in ("", "?"):
        return None
    return float(value)


def load_rows(path: str | Path) -> tuple[list[list[float | None]], list[int]]:
    features: list[list[float | None]] = []
    labels: list[int] = []

    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            values = [parse_cell(row[col]) for col in FEATURE_COLS]
            label = parse_cell(row["num"])
            if label is None:
                continue
            features.append(values)
            labels.append(1 if label > 0 else 0)

    return features, labels


def column_medians(features: list[list[float | None]]) -> list[float]:
    medians: list[float] = []
    cols = len(FEATURE_COLS)
    for col in range(cols):
        numbers = sorted(
            value for row in features if (value := row[col]) is not None
        )
        mid = len(numbers) // 2
        if len(numbers) % 2 == 0:
            medians.append((numbers[mid - 1] + numbers[mid]) / 2)
        else:
            medians.append(numbers[mid])
    return medians


def impute(
    features: list[list[float | None]], medians: list[float]
) -> list[list[float]]:
    filled: list[list[float]] = []
    for row in features:
        filled.append(
            [medians[i] if value is None else value for i, value in enumerate(row)]
        )
    return filled


raw_x, raw_y = load_rows(DATA_PATH)
medians = column_medians(raw_x)
filled_x = impute(raw_x, medians)

x = torch.tensor(filled_x, dtype=torch.float32)
y = torch.tensor(raw_y, dtype=torch.long)

mean = x.mean(dim=0)
std = x.std(dim=0).clamp(min=1e-6)
x = (x - mean) / std

n_samples = x.size(0)
n_test = max(1, int(n_samples * 0.2))
perm = torch.randperm(n_samples)
train_idx = perm[n_test:]
test_idx = perm[:n_test]

x_train, y_train = x[train_idx], y[train_idx]
x_test, y_test = x[test_idx], y[test_idx]

train_loader = DataLoader(
    TensorDataset(x_train, y_train),
    batch_size=BATCH_SIZE,
    shuffle=True,
)
test_loader = DataLoader(
    TensorDataset(x_test, y_test),
    batch_size=BATCH_SIZE,
)

model = nn.Sequential(
    nn.Linear(len(FEATURE_COLS), 64),
    nn.ReLU(),
    nn.Linear(64, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 2),
)

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LR)

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0

    for x_batch, y_batch in train_loader:
        logits = model(x_batch)
        loss = loss_fn(logits, y_batch)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    model.eval()
    correct = 0
    total = 0

    with torch.no_grad():
        for x_batch, y_batch in test_loader:
            logits = model(x_batch)
            predictions = logits.argmax(dim=1)
            correct += (predictions == y_batch).sum().item()
            total += y_batch.size(0)

    accuracy = correct / total
    train_loss = total_loss / len(train_loader)
    print(
        f"epoch={epoch + 1}, "
        f"loss={train_loss:.8f}, "
        f"test_accuracy={accuracy:.4f}"
    )

torch.save(model.state_dict(), MODEL_PATH)
SCALER_PATH.write_text(
    json.dumps(
        {
            "feature_cols": FEATURE_COLS,
            "medians": medians,
            "mean": mean.tolist(),
            "std": std.tolist(),
        },
        indent=2,
    ),
    encoding="utf-8",
)

print(f"Saved model to {MODEL_PATH}")
print(f"Saved scaler to {SCALER_PATH}")
