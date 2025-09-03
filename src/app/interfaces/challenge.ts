export interface Challenge {
  id?: number;
  name: string;
  description?: string;
  category: string;
  isInUserProgression: boolean;
  difficulty?: number;
  basePoints?: number;
  co2EstimateKg?: number;
  waterEstimateL?: number;
  wasteEstimateKg?: number;
  isRepeatable?: boolean;
}
