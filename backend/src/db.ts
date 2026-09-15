import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

export interface PredictionFeatures {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
}

export interface PredictionRow extends RowDataPacket {
  id: number;
  features_json: string;
  status: "pending" | "done" | "error";
  label: string | null;
  probability: number | null;
  error_message: string | null;
}

export const pool: Pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "heart",
  waitForConnections: true,
});

export async function waitForDatabase(): Promise<void> {
  for (;;) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export async function createPrediction(features: PredictionFeatures): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO predictions (features_json, status) VALUES (?, 'pending')",
    [JSON.stringify(features)]
  );
  return result.insertId;
}

export async function getPrediction(id: string | number): Promise<PredictionRow | null> {
  const [rows] = await pool.query<PredictionRow[]>(
    "SELECT * FROM predictions WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}
