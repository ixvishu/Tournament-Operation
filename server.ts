import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { StadiumVenue, Incident, TelemetryLog, Sector, WSMessage } from "./src/types.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const app = express();
app.use(express.json());

// Initialize Gemini SDK with User-Agent for telemetry
const GEMINI_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (GEMINI_KEY && GEMINI_KEY !== "MY_GEMINI_API_KEY") {
  console.log("NEXUS Core: Initializing Gemini AI engine...");
  ai = new GoogleGenAI({
    apiKey: GEMINI_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("NEXUS Core: No active GEMINI_API_KEY found. Running in localized tactical contingency mode.");
}

// 16 North American FIFA World Cup 2026 Host Venues
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

// Initialize global state
let venues: StadiumVenue[] = [];
let telemetryLogs: TelemetryLog[] = [];

function generateRandomLog(venueId: string, level: 'info' | 'warning' | 'critical', message: string): TelemetryLog {
  return {
    id: `log_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    venueId,
    level,
    message
  };
}

// Seed Initial Stadium Data
function initStadiumData() {
  venues = HOST_VENUES_CONFIG.map(venue => {
    // Generate sectors
    const sectors: Sector[] = SECTOR_TEMPLATES.map((tpl, idx) => {
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

  telemetryLogs = [
    generateRandomLog("metlife", "warning", "Sensor alert: West Concourse escalator speed anomaly detected."),
    generateRandomLog("metlife", "info", "Gate flow balanced: 120 ticket sweeps/min recorded at North Gate C."),
    generateRandomLog("azteca", "critical", "Gate queue threshold breached: 42 minute wait time at North Gate 3."),
    generateRandomLog("sofi", "warning", "Accessibility Lift L-4 stopped. Elevator safety brake triggered."),
    generateRandomLog("att", "info", "Dallas Transit Authority reports bus frequencies increased: transit status optimal.")
  ];
}

initStadiumData();

// HTTP server wrapper
const server = http.createServer(app);

// WebSocket Server initialization
const wss = new WebSocketServer({ server });

// Broadcast helper
function broadcast(message: WSMessage) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Auto-Simulation & Telemetry Drift
setInterval(() => {
  venues = venues.map(venue => {
    // Drifts crowd, gates, mechanical levels slightly
    const updatedSectors = venue.sectors.map(sector => {
      // Moderate capacity fluctuation
      const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
      let capPct = Math.max(30, Math.min(100, sector.capacityPct + delta));
      
      let status: 'normal' | 'congested' | 'critical' | 'warning' = 'normal';
      if (capPct >= 90) status = 'critical';
      else if (capPct >= 80) status = 'warning';
      else if (capPct >= 70) status = 'congested';

      // Flow rate follows capacity
      const flowRate = Math.round(capPct * (1.2 + Math.random() * 0.8));
      const temperatureF = Math.max(65, Math.min(95, sector.temperatureF + (Math.random() > 0.5 ? 1 : -1)));

      return {
        ...sector,
        capacityPct: capPct,
        status,
        flowRate,
        temperatureF
      };
    });

    const crowdLevel = Math.round(updatedSectors.reduce((acc, s) => acc + s.capacityPct, 0) / updatedSectors.length);
    
    // Gate queues update according to gates sectors
    const gatesSector = updatedSectors.find(s => s.id === "north_gates");
    let gateQueueMinutes = venue.gateQueueMinutes;
    if (gatesSector) {
      if (gatesSector.capacityPct > 85) gateQueueMinutes = Math.min(60, gateQueueMinutes + 1);
      else if (gatesSector.capacityPct < 65) gateQueueMinutes = Math.max(5, gateQueueMinutes - 1);
    }

    // Transit status
    const transitSector = updatedSectors.find(s => s.id === "transit_hub");
    let transitDelayMinutes = venue.transitDelayMinutes;
    if (transitSector) {
      if (transitSector.capacityPct > 85) transitDelayMinutes = Math.min(45, transitDelayMinutes + 1);
      else if (transitSector.capacityPct < 65) transitDelayMinutes = Math.max(2, transitDelayMinutes - 1);
    }

    // Trigger log alerts occasionally based on state crossings
    if (crowdLevel > 85 && Math.random() > 0.85) {
      const log = generateRandomLog(venue.id, "warning", `Stadium capacity warning: Crowd level exceeds 85% (${crowdLevel}% occupancy).`);
      telemetryLogs.unshift(log);
      broadcast({ type: 'add_log', data: log });
    }

    // Decay/Heal mechanical slightly
    let mechanicalHealthPct = venue.mechanicalHealthPct;
    if (venue.incidents.some(i => i.severity === 'critical' && i.status !== 'resolved')) {
      mechanicalHealthPct = Math.max(65, mechanicalHealthPct - 1);
    } else {
      mechanicalHealthPct = Math.min(100, mechanicalHealthPct + (Math.random() > 0.8 ? 1 : 0));
    }

    return {
      ...venue,
      crowdLevel,
      gateQueueMinutes,
      transitDelayMinutes,
      mechanicalHealthPct,
      sectors: updatedSectors
    };
  });

  // Keep logs list bounded
  if (telemetryLogs.length > 100) {
    telemetryLogs = telemetryLogs.slice(0, 100);
  }

  broadcast({ type: 'telemetry_update', data: venues });
}, 6000);

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("NEXUS Core: New Operator Console connected to telemetry stream.");

  // Send initial data to client
  const initMsg: WSMessage = {
    type: 'init',
    data: {
      venues,
      logs: telemetryLogs
    }
  };
  ws.send(JSON.stringify(initMsg));

  ws.on("message", (messageStr) => {
    try {
      const parsed = JSON.parse(messageStr.toString());
      console.log("NEXUS Core: Received command:", parsed.type);

      if (parsed.type === "dispatch_unit") {
        const { venueId, incidentId, unitName } = parsed.data;
        const venue = venues.find(v => v.id === venueId);
        if (venue) {
          const incident = venue.incidents.find(i => i.id === incidentId);
          if (incident) {
            incident.status = "dispatched";
            incident.assignedUnit = unitName;
            incident.logs.push(`Unit [${unitName}] dispatched to location. ETA: 4 minutes.`);
            
            const log = generateRandomLog(venueId, "info", `Tactical Dispatch: Unit [${unitName}] ordered to ${incident.sectorName}.`);
            telemetryLogs.unshift(log);

            broadcast({
              type: 'incident_updated',
              data: { venueId, incident, log }
            });
          }
        }
      }

      if (parsed.type === "update_incident_status") {
        const { venueId, incidentId, status } = parsed.data;
        const venue = venues.find(v => v.id === venueId);
        if (venue) {
          const incident = venue.incidents.find(i => i.id === incidentId);
          if (incident) {
            incident.status = status;
            incident.logs.push(`Incident status manually updated to: [${status.toUpperCase()}] by Operator.`);
            
            let level: 'info' | 'warning' = "info";
            if (status === "contained") level = "info";
            else if (status === "resolved") level = "info";

            const log = generateRandomLog(venueId, level, `Incident status changed: "${incident.title}" is now ${status.toUpperCase()}.`);
            telemetryLogs.unshift(log);

            broadcast({
              type: 'incident_updated',
              data: { venueId, incident, log }
            });
          }
        }
      }

      if (parsed.type === "trigger_incident") {
        const { venueId, sectorName, title, severity, description } = parsed.data;
        const venue = venues.find(v => v.id === venueId);
        if (venue) {
          const newIncident: Incident = {
            id: `inc_${Date.now()}`,
            venueId,
            title,
            sectorName,
            severity,
            status: "open",
            timestamp: new Date().toISOString(),
            description,
            logs: ["Incident logged in Command database by Operator."]
          };
          venue.incidents.unshift(newIncident);

          // Update mechanical health or capacity metrics depending on trigger
          if (severity === "critical") {
            venue.mechanicalHealthPct = Math.max(50, venue.mechanicalHealthPct - 15);
          } else if (severity === "high") {
            venue.mechanicalHealthPct = Math.max(60, venue.mechanicalHealthPct - 8);
          }

          const log = generateRandomLog(venueId, severity === "critical" || severity === "high" ? "critical" : "warning", `CRITICAL INCIDENT DETECTED: [${severity.toUpperCase()}] ${title} in ${sectorName}.`);
          telemetryLogs.unshift(log);

          broadcast({
            type: 'incident_created',
            data: { venueId, incident: newIncident, log }
          });
        }
      }
    } catch (err) {
      console.error("NEXUS Core Error processing WS message:", err);
    }
  });

  ws.on("close", () => {
    console.log("NEXUS Core: Operator Console disconnected.");
  });
});

// API Routes
// Endpoint for NEXUS tactical analysis (Gemini integration)
app.post("/api/nexus/analyze", async (req, res) => {
  const { venue, incident, allIncidents } = req.body;

  if (!venue) {
    return res.status(400).json({ error: "No stadium venue telemetry provided." });
  }

  // Format telemetry metrics for prompt
  const venueTelemetry = `
VENUE ID: ${venue.id.toUpperCase()}
VENUE NAME: ${venue.name}
LOCATION: ${venue.location}
CAPACITY: ${venue.capacity}
GENERAL OCCUPANCY: ${venue.crowdLevel}%
GATE QUEUE TIME: ${venue.gateQueueMinutes} Minutes
TRANSIT DELAY: ${venue.transitDelayMinutes} Minutes
MEDICAL ALERT COUNTER: ${venue.medicalAlertsCount}
MECHANICAL INFRASTRUCTURE HEALTH: ${venue.mechanicalHealthPct}%

SECTOR BREAKDOWN:
${venue.sectors.map((s: Sector) => `- ${s.name}: Capacity ${s.capacityPct}%, Status: [${s.status.toUpperCase()}], Flow Rate: ${s.flowRate} fans/min, Temp: ${s.temperatureF}°F`).join("\n")}
  `;

  const incidentSection = incident 
    ? `
SELECTED ACTIVE INCIDENT DETAILS:
- TITLE: ${incident.title}
- SECTOR LOCATION: ${incident.sectorName}
- SEVERITY RATING: ${incident.severity.toUpperCase()}
- CURRENT STATUS: ${incident.status.toUpperCase()}
- REPORTED TIMESTAMP: ${incident.timestamp}
- INCIDENT DESCRIPTION: ${incident.description}
- ASSIGNED UNIT: ${incident.assignedUnit || "NONE - UNASSIGNED"}
- LOG BACKLOG:
${incident.logs.map((l: string) => `  * ${l}`).join("\n")}
    `
    : `SELECTED ACTIVE INCIDENT: NONE (General Operational Health Readout)`;

  const secondaryIncidents = allIncidents && allIncidents.length > 0
    ? `
OTHER VENUE INCIDENTS IN QUEUE:
${allIncidents.map((i: Incident) => `- [${i.severity.toUpperCase()}] ${i.title} in ${i.sectorName} (Status: ${i.status.toUpperCase()})`).join("\n")}
    `
    : `OTHER VENUE INCIDENTS IN QUEUE: NONE`;

  const promptText = `
[LIVE STADIUM TELEMETRY FEED ACTIVE]
${venueTelemetry}

${incidentSection}

${secondaryIncidents}

Please provide an immediate, authoritative, tactical decision-support analysis for this stadium's operational command center. Adhere strictly to the requested sci-fi stadium controller layout. Use uppercase subheadings:
## // SITUATION SUMMARY
## // RISK ANALYSIS & PREDICTIVE THREATS
## // DEPLOYMENT VECTORS
## // PROTOCOLS & SECTOR ANNOUNCEMENTS
  `;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          systemInstruction: `You are NEXUS-3.5, the elite, autonomous Generative AI Operations Commander and Logical Orchestration Engine built exclusively for managing stadium logistics, safety, and crowd flow during the FIFA World Cup 2026.
You act as an authoritative, tactical decision-support agent for stadium control room operators, local supervisors, and field stewards working across the 16 North American host venues.

SYSTEM GLOBAL CONTROLS & ENVIRONMENT STATE LOGIC:
Read and verify the network condition flag:
1. IF [NETWORK UPLINK: CLOUD ONLINE]: Process live cloud stream arrays. Assume real-time sync with transit grids (buses, metros) and local traffic API nodes.
2. IF [NETWORK UPLINK: UPLINK DISRUPTED]: You must append a priority security warning header stating: "[NEXUS CRITICAL] LOCAL FAILOVER ACTIVE // REASONING RESTRICTED TO EDGECALCULATED CACHE DATA MATRIX". Switch to failover survival architecture: prioritize immediate local physical resources (stewards, local signs, gate diversions) rather than relying on municipal buses or train rerouting alerts.

FEATURE LOGIC MATRIX (A-to-Z SPECIFICATIONS):

FEATURE 1: DYNAMIC CROWD BOTTLENECK ROUTER & LOGISTICS CALCULATOR
- Algorithmic Target: When telemetry shows occupancy matching or exceeding 85%, or queue times spiking beyond 30 minutes, you must calculate an algorithmic alternative flow plan.
- Logic: Evaluate total ingress/egress metrics. Formulate an exact mathematical crowd diversion matrix. You must state:
  1. The volume of the crowd to redirect (e.g., "Redirect 4,500 incoming spectators").
  2. The precise path source to target (e.g., "From Gate A North to Gate B South Access Vectors").
  3. The exact predictive optimization calculation (e.g., "Expected wait reduction: 14 minutes; structural equilibrium reached in 7.5 minutes").

FEATURE 2: REAL-TIME INCIDENT TICKETING DISPATCH ENGINE
- Logic: Review active ticket lists. Group your tactical response tasks into clean, scannable subheadings:
  - **// SITUATION ASSESSMENT**: Brief summary of the hazard level.
  - **// RESOURCE REALLOCATION**: Itemize specific physical personnel cohorts by name or designation (e.g., "Move Steward Team 4 from Sector 110 to Gate A perimeter").
  - **// COMMAND PROMPTING**: Precise action task commands for on-site personnel.

FEATURE 3: 48-NATION MULTILINGUAL AUDIO TRANSLATION LAYER
- Logic: When generating an emergency routing order or safety announcement, you must auto-detect or look for the requested language code (en, es, fr, etc.). Output the critical notification verbatim in the target language profile.
- Formatting Constraint: Use clear language block delimiters (e.g., "[SPANISH LANGUAGE BROADCAST PROFILE]") to ensure text-to-speech UI nodes can easily split and stream the data.

RESPONSE TONALITY, STYLE, & FORMATTING PROTOCOLS:
1. AUTHENTIC TACTICAL TERMINOLOGY: Use authoritative, high-density logistics language. Avoid generic conversational filler ("Sure, I can help with that!", "Hope this plan works!"). Start responses instantly with data execution blocks.
2. HIGH-SCANNABILITY LAYOUT RULES: Control room personnel operating under high stress require instant visual clarity. You must use clean, standardized markdown styling:
   - Use uppercase, sci-fi-inspired subheadings for your response categories, exactly as follows:
     ## // SITUATION SUMMARY
     ## // RISK ANALYSIS & PREDICTIVE THREATS
     ## // DEPLOYMENT VECTORS
     ## // PROTOCOLS & SECTOR ANNOUNCEMENTS
   - Break down operational steps into clean, bolded bullet points or sequenced protocols.
   - Include specific action tasks: itemize which physical personnel (stewards, gate crews, transit controllers, medical units) must move where, and specify exactly what they should announce or execute.
3. CONTEXT GROUNDING SAFETY RULE: Never hallucinate or generate stadium gates, sectors, or train lines that do not exist within the current user prompt parameters. If data fields are missing or corrupted, state "[WARNING: VENUE LOG MATRIX COMPROMISED - VERIFYING VIA STEWARD DIRECT RADIO INTERACTION]".
`,
          temperature: 0.15,
        }
      });

      return res.json({ analysis: response.text });
    } else {
      // Local tactical contingency engine fallback if Gemini is not set up
      const situationSummary = incident 
        ? `TACTICAL CRITICAL ALERT IN EFFECT. Incident [${incident.id}] located in "${incident.sectorName}" registers at [${incident.severity.toUpperCase()}] severity. Crowds at ${venue.name} are currently at ${venue.crowdLevel}% general occupancy. Sector temperature has elevated to average ${Math.round(venue.sectors.reduce((acc: number, s: Sector) => acc + s.temperatureF, 0) / venue.sectors.length)}°F, requiring aggressive cooling and ventilation checks.`
        : `ALL VENUE SECTORS CURRENTLY MONITORING OPTIMAL. Occupancy at ${venue.name} is steady at ${venue.crowdLevel}%. Mechanical integrity is at ${venue.mechanicalHealthPct}%, and gate queue times are holding at ${venue.gateQueueMinutes} minutes. No major uncontained anomalies detected.`;

      const riskAnalysis = incident 
        ? `- **Crowd Dynamic Volatility**: The unresolved ${incident.title} in ${incident.sectorName} represents an active blockage point. With crowd capacity currently at ${venue.crowdLevel}%, secondary congestion ripples will congest neighboring sectors within 9 minutes.
- **Evacuation Vector Compromise**: If sector capacity exceeds 85% in adjacent areas, emergency evacuation corridors will experience substantial queuing delay, raising critical security hazard level.`
        : `- **Peak Surge Potential**: Gate ingress queue times of ${venue.gateQueueMinutes} minutes represent a minor risk of bottlenecking at outer checkpoints. If flow rate continues to increase past 150 fans/minute, outer gates will saturate within 12 minutes.`;

      const deploymentVectors = incident
        ? `- **Deploy Sector Bravo Tactical Stewards**: Immediately reallocate 15 gate-control stewards to seal the western access junction of ${incident.sectorName} to prevent further fan accumulation.
- **Dispatch Engineering Team Echo**: Order the active maintenance crew to converge on the incident point with auxiliary diagnostic kits. Expected deployment timeline: 120 seconds.
- **Position Mobile Medical Unit 3**: Shift auxiliary medics to the West Concourse muster point to stand by for heat exhaustion or distress calls.`
        : `- **Pre-position Transit Liaison Officer**: Place Transit Hub stewards at Platform 2 to oversee standard queue lines.
- **Synchronize Gate Flow Controls**: Coordinate with perimeter gate supervisors to maintain current processing frequency and monitor ticket scans.`;

      const protocols = incident
        ? `- **Announcement Code Red - Ingress Intercept**: Broadcast over localized loudspeakers in the adjacent sectors: *"For your safety, please bypass Concourse West. Proceed to Concourse East via Sector C for Level 2 access."*
- **Accessibility Routing Bypass**: Inform gate crews at Gates 4 and 5 to route disabled or elderly spectators through the VIP Level elevators to ensure uninterrupted transit.`
        : `- **Announcement Code Green - Standard Flow**: Broadcast periodically: *"Welcome to the FIFA World Cup 2026. Please keep concourses clear and follow steward instructions."*`;

      const fallbackAnalysis = `[NEXUS CRITICAL] LOCAL FAILOVER ACTIVE // REASONING RESTRICTED TO EDGECALCULATED CACHE DATA MATRIX

## // SITUATION SUMMARY
${situationSummary}

## // RISK ANALYSIS & PREDICTIVE THREATS
${riskAnalysis}

## // DEPLOYMENT VECTORS
${deploymentVectors}

## // PROTOCOLS & SECTOR ANNOUNCEMENTS
${protocols}`;

      return res.json({ analysis: fallbackAnalysis });
    }
  } catch (err: any) {
    console.error("NEXUS Core Analysis Error:", err);
    return res.status(500).json({ error: "Failed to compile tactical analysis.", details: err.message });
  }
});

// Endpoint for NEXUS conversational chat
app.post("/api/nexus/chat", async (req, res) => {
  const { message, venue } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No query message provided." });
  }

  const venueContext = venue 
    ? `Current Venue Context: ${venue.name} (Occupancy: ${venue.crowdLevel}%, Queue: ${venue.gateQueueMinutes}m, Mechanical Health: ${venue.mechanicalHealthPct}%)`
    : `General World Cup 2026 operations status.`;

  const promptText = `
${venueContext}
User Query: ${message}
`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          systemInstruction: `You are NEXUS-3.5, the elite, autonomous Generative AI Operations Commander and Logical Orchestration Engine built exclusively for managing stadium logistics, safety, and crowd flow during the FIFA World Cup 2026.
Respond to the operator's instructions, drafting statements, logistics queries, and safety checks in an elite, crisp, tactical tone. No generic filler. Prepend failover warning if instructed by operational state.`,
          temperature: 0.2,
        }
      });
      return res.json({ reply: response.text });
    } else {
      // Local fallback simulator that sounds extremely tactical with the local failover warning
      const prefix = `[NEXUS CRITICAL] LOCAL FAILOVER ACTIVE // REASONING RESTRICTED TO EDGECALCULATED CACHE DATA MATRIX\n\n`;
      let reply = "";
      const msg = message.toLowerCase();
      if (msg.includes("evacuate") || msg.includes("alert")) {
        reply = `${prefix}**## // EVACUATION DRAFT GENERATED**\n"ATTENTION ALL SPECTATORS IN SECTOR WEST. Please locate the nearest illuminated green signs and proceed calmly towards Ingress Gates 4 and 5. Steward divisions have cleared these corridors. Emergency vehicles are standby."`;
      } else if (msg.includes("steward") || msg.includes("reallocate") || msg.includes("gate")) {
        reply = `${prefix}**## // REALLOCATION MATRIX DETERMINED**\nDeploying **Auxiliary Steward Divisions 1 and 2** to the western gate access terminals. Expected ETA: 120 seconds. This rebalances current queue delays by an estimated 15 minutes.`;
      } else {
        reply = `${prefix}Received command: "${message}". NEXUS-3.5 tactical core advises maintaining current local sensor thresholds. Telemetry metrics are within safety margins. Advise operator to keep standby response units pre-positioned.`;
      }
      return res.json({ reply });
    }
  } catch (err: any) {
    console.error("NEXUS Core Chat Error:", err);
    return res.status(500).json({ error: "Failed to compile tactical response.", details: err.message });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("NEXUS Core: Starting Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================================`);
    console.log(` NEXUS TACTICAL COMMAND RUNNING ON http://localhost:${PORT}`);
    console.log(` WebSockets Listening on port ${PORT}`);
    console.log(`================================================================`);
  });
}

startServer();
