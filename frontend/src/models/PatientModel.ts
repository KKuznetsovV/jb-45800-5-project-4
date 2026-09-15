export const FEATURE_COLS = [
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

class PatientModel {
  public id: number = 0;
  public name: string = "";
  public expected_label: "low risk" | "high risk" = "low risk";
  public age: number = 0;
  public sex: number = 0;
  public cp: number = 0;
  public trestbps: number = 0;
  public chol: number = 0;
  public fbs: number = 0;
  public restecg: number = 0;
  public thalach: number = 0;
  public exang: number = 0;
  public oldpeak: number = 0;
}

export default PatientModel;
