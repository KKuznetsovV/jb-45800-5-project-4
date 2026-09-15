# Heart Attack Risk Predictor

Browser app that classifies heart-attack risk from clinical measurements. The model is a small PyTorch network trained on the [Heart Attack Prediction](https://www.kaggle.com/datasets/imnikhilanand/heart-attack-prediction) dataset (UCI Hungarian heart disease, 294 rows). Coding style follows the course torch examples in [2026-08-11-torch-2](https://github.com/shaharsol/jb-45800-5/tree/main/2026-08-11-torch-2).

This is a study project, not medical advice.

## Architecture

1. The browser sends a form to the Node backend.
2. Node writes a `pending` row to MySQL and publishes the row id to RabbitMQ.
3. The Python worker reads the row, runs `heart_attack_model.pt`, and writes `done` back to MySQL.
4. The browser polls `/api/predictions/:id` until a result exists.

## Run with Docker Compose

The checker does not retrain. The committed `.pt` file is used for inference.

```bash
docker compose up --build
```

Open http://localhost:3005

## Train and check locally (no Docker)

```bash
python train.py
python predict.py
```

`python predict.py` with no arguments runs the 10 check patients in `examples/patients.json`.

## Check patients for Shahar

`examples/patients.json` is a small 10-patient set for checking the browser app.

1. Open http://localhost:3005
2. Click patients **1–5** (expected **low risk**) and submit.
3. Click patients **6–10** (expected **high risk**) and submit.

| id | Expected |
| --- | --- |
| 1–5 | low risk |
| 6–10 | high risk |

Calibration: a small `32-16-2` net with 40 epochs sat around loss `0.32`. The current net is `64-64-32-2` with 75 epochs, training loss about `0.01`–`0.08`. Longer runs (800 epochs) drove loss to `~0` but hurt test accuracy.
