import { StadiumVenue, Incident, TelemetryLog, Sector } from "./types";

const HOST_VENUES_CONFIG = [
  { id: "metlife", name: "MetLife Stadium", location: "East Rutherford, NJ/NY", capacity: 82500 },
  { id: "azteca", name: "Estadio Azteca", location: "Mexico City, MX", capacity: 87523 },
  { id: "sofi", name: "SoFi Stadium", location: "Los Angeles, CA", capacity: 70240 },
  { id: "att", name: "AT&T Stadium", location: "Dallas, TX", capacity: 80000 },
  { id: "bcplace", name: "BC Place", location: "Vancouver, BC", capacity: 54500 },
  { id: "mercedes", name: "Mercedes-Benz Stadium", location: "Atlanta, GA", capacity: 71000 },
  { id: "arrowhead", name: "Arrowhead Stadium", location: "Kansas City, MO", capacity: 76400 },
  { id: "hardrock", name: "Hard Rock Stadium", location: "Miami, FL", capacity: 64767 },
  { id: "nrg", name: "NRG Stadium", location: "Houston, TX", capacity: 72220 },
  { id: "gillette", name: "Gillette Stadium", location: "Boston, MA", capacity: 65878 },
  { id: "lincoln", name: "Lincoln Financial Field", location: "Philadelphia, PA", capacity: 67594 },
  { id: "lumen", name: "Lumen Field", location: "Seattle, WA", capacity: 69000 },
  { id: "levis", name: "Levi's Stadium", location: "San Francisco, CA", capacity: 68500 },
  { id: "bmo", name: "BMO Field", location: "Toronto, ON", capacity: 45736 },
  { id: "akron", name: "Estadio Akron", location: "Guadalajara, MX", capacity: 48071 },
  { id: "bbva", name: "Estadio BBVA", location: "Monterrey, MX", capacity: 53500 }
];

const SECTOR_TEMPLATES = [
  { id: "north_gates", name: "North Security Gates (1-4)" },
  { id: "south_gates", name: "South Security Gates (5-8)" },
  { id: "east_concourse", name: "Concourse East (Level 1)" },
  { id: "west_concourse", name: "Concourse West (Level 2)" },
  { id: "transit_hub", name: "Intermodal Transit Terminal" },
  { id: "vip_suites", name: "VIP Suites & Press Level" }
];

export function generateRandomLog(venueId: string, level: 'info' | 'warning' | 'critical', message: string): TelemetryLog {
  return {
    id: `log_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
    venueId,
    level,
    message
  };
}

export function getInitialMockData(): { venues: StadiumVenue[]; logs: TelemetryLog[] } {
  const venues: StadiumVenue[] = HOST_VENUES_CONFIG.map(venue => {
    // Generate sectors
    const sectors: Sector[] = SECTOR_TEMPLATES.map((tpl) => {
      // Create some initial congestion for excitement
      let capPct = 50 + Math.floor(Math.random() * 30);
      let status: 'normal' | 'congested' | 'critical' | 'warning' = 'normal';
      
      // Specifically trigger heavy flow at gates or transit hubs
      if (tpl.id.includes("gates") && Math.random() > 0.5) {
        capPct = 78 + Math.floor(Math.random() * 15);
      } else if (tpl.id === "transit_hub" && Math.random() > 0.7) {
        capPct = 85 + Math.floor(Math.random() * 12);
      }

      if (capPct >= 90) status = 'critical';
      else if (capPct >= 80) status = 'warning';
      else if (capPct >= 70) status = 'congested';

      return {
        id: tpl.id,
        name: tpl.name,
        capacityPct: capPct,
        status,
        temperatureF: 70 + Math.floor(Math.random() * 15),
        flowRate: 40 + Math.floor(Math.random() * 120)
      };
    });

    const crowdLevel = Math.round(sectors.reduce((acc, s) => acc + s.capacityPct, 0) / sectors.length);
    const gateQueueMinutes = crowdLevel > 80 ? 25 + Math.floor(Math.random() * 20) : 5 + Math.floor(Math.random() * 15);
    const transitDelayMinutes = sectors.find(s => s.id === "transit_hub")!.capacityPct > 80 ? 15 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 8);
    const mechanicalHealthPct = 85 + Math.floor(Math.random() * 15);

    return {
      id: venue.id,
      name: venue.name,
      location: venue.location,
      capacity: venue.capacity,
      crowdLevel,
      gateQueueMinutes,
      transitDelayMinutes,
      medicalAlertsCount: Math.random() > 0.75 ? 1 : 0,
      mechanicalHealthPct,
      sectors,
      incidents: []
    };
  });

  // Seed standard active incidents to make it look live
  const metlife = venues.find(v => v.id === "metlife")!;
  const metlifeIncident: Incident = {
    id: "inc_001",
    venueId: "metlife",
    title: "Escalator mechanical jam - Sector B",
    sectorName: "Concourse West (Level 2)",
    severity: "high",
    status: "open",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    description: "Mechanical failure detected on primary ascending escalator in West Concourse. Crowd forming at the base of escalator. Local supervisor requesting engineering dispatch.",
    assignedUnit: undefined,
    logs: ["Incident reported automatically via sensor telemetry.", "Escalator powered off safely. Local steward team responding to redirect traffic."]
  };
  metlife.incidents.push(metlifeIncident);
  metlife.mechanicalHealthPct = 82;

  const azteca = venues.find(v => v.id === "azteca")!;
  const aztecaIncident: Incident = {
    id: "inc_002",
    venueId: "azteca",
    title: "Crowd congestion backup at Gate 3",
    sectorName: "North Security Gates (1-4)",
    severity: "critical",
    status: "dispatched",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    description: "North security gates experiencing high fan processing times. Perimeter queue stretching past Outer Ring Security Checkpoint. General crowd congestion reaching 92%.",
    assignedUnit: "Sectors A & B Stewards Division",
    logs: [
      "Perimeter sensors detected over-capacity queue.",
      "Dispatch request approved. Auxiliary gate stewards ordered to reinforce Ticket Processing Unit.",
      "Loudspeakers in Sector A activated: redirecting excess fans to Gate 1 and 2."
    ]
  };
  azteca.incidents.push(aztecaIncident);
  azteca.gateQueueMinutes = 42;

  const sofi = venues.find(v => v.id === "sofi")!;
  const sofiIncident: Incident = {
    id: "inc_003",
    venueId: "sofi",
    title: "Accessibility Lift Failure",
    sectorName: "VIP Suites & Press Level",
    severity: "medium",
    status: "contained",
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    description: "Elevator lift L-4 servicing disabled fans has stopped between floors G and Concourse 1. Two wheelchair-bound spectators and one aide are inside.",
    assignedUnit: "Rapid Response Engineering Team Delta",
    logs: [
      "Sensors reported emergency lift stop.",
      "Engineering dispatched to lift shaft L-4.",
      "Verbal comms established. Passengers are calm and secure. Extraction protocol in progress."
    ]
  };
  sofi.incidents.push(sofiIncident);

  const logs = [
    generateRandomLog("metlife", "warning", "Sensor alert: West Concourse escalator speed anomaly detected."),
    generateRandomLog("metlife", "info", "Gate flow balanced: 120 ticket sweeps/min recorded at North Gate C."),
    generateRandomLog("azteca", "critical", "Gate queue threshold breached: 42 minute wait time at North Gate 3."),
    generateRandomLog("sofi", "warning", "Accessibility Lift L-4 stopped. Elevator safety brake triggered."),
    generateRandomLog("att", "info", "Dallas Transit Authority reports bus frequencies increased: transit status optimal.")
  ];

  return { venues, logs };
}
