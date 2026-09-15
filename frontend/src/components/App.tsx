import { useEffect, useState } from "react";

import PatientModel, { FEATURE_COLS } from "../models/PatientModel";
import PredictionModel from "../models/PredictionModel";
import predictionService, { type PredictionFeatures } from "../services/prediction-service";
import PredictionForm from "./prediction-form/PredictionForm";
import ResultPanel from "./result-panel/ResultPanel";
import SamplePatients from "./sample-patients/SamplePatients";

type Status = "idle" | "pending" | "done" | "error";

function toFeatures(patient: PatientModel): PredictionFeatures {
  const features = {} as PredictionFeatures;
  for (const col of FEATURE_COLS) {
    features[col] = patient[col];
  }
  return features;
}

async function waitForResult(id: number): Promise<PredictionModel> {
  for (let i = 0; i < 40; i += 1) {
    const prediction = await predictionService.getById(id);
    if (prediction.status === "done" || prediction.status === "error") {
      return prediction;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("timeout");
}

function App() {
  const [patients, setPatients] = useState<PatientModel[]>([]);
  const [features, setFeatures] = useState<PredictionFeatures | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PredictionModel | null>(null);

  useEffect(() => {
    predictionService.getSamplePatients().then((data) => {
      setPatients(data);
      if (data.length > 0) {
        setFeatures(toFeatures(data[0]));
      }
    });
  }, []);

  async function handleSubmit(values: PredictionFeatures) {
    setStatus("pending");
    setMessage("שולח לתור וממתין למודל...");
    setResult(null);

    try {
      const job = await predictionService.create(values);
      const prediction = await waitForResult(job.id);
      setResult(prediction);
      if (prediction.status === "error") {
        setStatus("error");
        setMessage(prediction.errorMessage || "שגיאה במודל");
        return;
      }
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message);
    }
  }

  return (
    <main className="page">
      <header>
        <p className="eyebrow">PyTorch + Node + RabbitMQ + MySQL</p>
        <h1>חיזוי סיכון להתקף לב</h1>
        <p className="lede">
          מלאו מדדים רפואיים. השרת ב-Node שומר את הבקשה במסד הנתונים ושולח משימה
          לתור. תהליך Python טוען את מודל ה-<code>.pt</code> ומחזיר תוצאה.
        </p>
      </header>

      <SamplePatients patients={patients} onSelect={(patient) => setFeatures(toFeatures(patient))} />

      {features && (
        <PredictionForm
          initialValues={features}
          disabled={status === "pending"}
          onSubmit={handleSubmit}
        />
      )}

      <ResultPanel status={status} message={message} result={result} />

      <p className="disclaimer">זהו פרויקט לימודי בלבד ואינו ייעוץ רפואי.</p>
    </main>
  );
}

export default App;
