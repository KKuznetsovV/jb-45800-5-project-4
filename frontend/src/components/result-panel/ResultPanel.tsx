import PredictionModel from "../../models/PredictionModel";

interface Props {
  status: "idle" | "pending" | "done" | "error";
  message: string;
  result: PredictionModel | null;
}

function ResultPanel({ status, message, result }: Props) {
  if (status === "idle") {
    return null;
  }

  const isHigh = result?.label === "high risk";
  const className = ["result", status === "pending" ? "" : isHigh ? "high" : "low"]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className}>
      {status === "done" && result?.probability != null
        ? isHigh
          ? `סיכון גבוה (${Math.round(result.probability * 100)}% ביטחון במודל)`
          : `סיכון נמוך (${Math.round(result.probability * 100)}% ביטחון במודל)`
        : message}
    </section>
  );
}

export default ResultPanel;
