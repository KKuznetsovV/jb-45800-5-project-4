import express, { type Request, type Response } from "express";

import { waitForDatabase, createPrediction, getPrediction, type PredictionFeatures } from "./db";
import { waitForQueue, publishPrediction } from "./queue";

const FEATURE_COLS = [
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
] as const;

const app = express();
app.use(express.json());

app.post("/api/predictions", async (req: Request, res: Response) => {
  const features = {} as PredictionFeatures;

  for (const col of FEATURE_COLS) {
    const value = req.body[col];
    if (value === undefined || value === "") {
      res.status(400).json({ error: `missing field: ${col}` });
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      res.status(400).json({ error: `invalid number: ${col}` });
      return;
    }
    features[col] = parsed;
  }

  const id = await createPrediction(features);
  await publishPrediction(id);
  res.status(202).json({ id, status: "pending" });
});

app.get("/api/predictions/:id", async (req: Request, res: Response) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const prediction = await getPrediction(idParam);
  if (!prediction) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({
    id: prediction.id,
    status: prediction.status,
    label: prediction.label,
    probability: prediction.probability,
    errorMessage: prediction.error_message,
  });
});

const port = Number(process.env.PORT || 3000);

async function start(): Promise<void> {
  await waitForDatabase();
  await waitForQueue();
  app.listen(port, () => {
    console.log(`backend listening on ${port}`);
  });
}

start();
