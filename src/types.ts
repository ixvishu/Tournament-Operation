export interface Sector {
  id: string;
  name: string;
  capacityPct: number;
  status: 'normal' | 'congested' | 'critical' | 'warning';
  temperatureF: number;
  flowRate: number; // fans per minute
}

export interface Incident {
  id: string;
  venueId: string;
  title: string;
  sectorName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'dispatched' | 'contained' | 'resolved';
  timestamp: string;
  description: string;
  assignedUnit?: string;
  logs: string[];
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  venueId: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
}

export interface StadiumVenue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  crowdLevel: number; // general occupancy percentage
  gateQueueMinutes: number;
  transitDelayMinutes: number;
  medicalAlertsCount: number;
  mechanicalHealthPct: number;
  sectors: Sector[];
  incidents: Incident[];
}

export interface ChatMessage {
  id: string;
  sender: 'operator' | 'nexus';
  text: string;
  timestamp: string;
}

export type WSMessage =
  | { type: 'init'; data: { venues: StadiumVenue[]; logs: TelemetryLog[] } }
  | { type: 'telemetry_update'; data: StadiumVenue[] }
  | { type: 'incident_created'; data: { venueId: string; incident: Incident; log: TelemetryLog } }
  | { type: 'incident_updated'; data: { venueId: string; incident: Incident; log: TelemetryLog } }
  | { type: 'add_log'; data: TelemetryLog };
