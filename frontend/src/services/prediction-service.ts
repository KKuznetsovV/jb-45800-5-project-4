import axios from "axios";

import { FEATURE_COLS } from "../models/PatientModel";
import type PatientModel from "../models/PatientModel";
import type PredictionModel from "../models/PredictionModel";
import api from "./api";

export type PredictionFeatures = Record<(typeof FEATURE_COLS)[number], number>;

interface CreatePredictionResponse {
  id: number;
  status: string;
}

interface PatientsFile {
  title: string;
  patients: PatientModel[];
}

async function create(features: PredictionFeatures): Promise<CreatePredictionResponse> {
  const response = await api.post<CreatePredictionResponse>("/predictions", features);
  return response.data;
}

async function getById(id: number): Promise<PredictionModel> {
  const response = await api.get<PredictionModel>(`/predictions/${id}`);
  return response.data;
}

async function getSamplePatients(): Promise<PatientModel[]> {
  const response = await axios.get<PatientsFile>("/patients.json");
  return response.data.patients;
}

const predictionService = { create, getById, getSamplePatients };
export default predictionService;
