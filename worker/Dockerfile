FROM python:3.11-slim

WORKDIR /app

COPY worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY worker/worker.py ./worker.py
COPY models/heart_attack_model.pt ./models/heart_attack_model.pt
COPY models/scaler.json ./models/scaler.json

ENV MODEL_PATH=/app/models/heart_attack_model.pt
ENV SCALER_PATH=/app/models/scaler.json

CMD ["python", "-u", "worker.py"]
