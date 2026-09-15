class PredictionModel {
  public id: number = 0;
  public status: "pending" | "done" | "error" = "pending";
  public label: "low risk" | "high risk" | null = null;
  public probability: number | null = null;
  public errorMessage: string | null = null;
}

export default PredictionModel;
