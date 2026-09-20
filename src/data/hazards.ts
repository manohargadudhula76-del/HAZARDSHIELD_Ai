import { MapLocationMarker } from '../types/hazard';
import { mockHabitations } from './habitations';

export const mockMapMarkers: MapLocationMarker[] = mockHabitations.map(h => ({
  id: h.id,
  name: h.name,
  district: h.district,
  state: h.state,
  lat: h.latitude,
  lng: h.longitude,
  hazardScore: h.hazardScore,
  riskLevel: h.riskLevel,
  hazardType: h.primaryHazard,
  population: h.population,
  carryingCapacityPercentage: h.carryingCapacityPercentage,
  status: h.relocationStatus
}));
