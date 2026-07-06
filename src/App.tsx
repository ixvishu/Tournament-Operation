import React, { useEffect, useState, useRef } from 'react';
import { StadiumVenue, Incident, TelemetryLog, WSMessage } from './types';
import VenueSelector from './components/VenueSelector';
import TelemetryGrid from './components/TelemetryGrid';
import IncidentManager from './components/IncidentManager';
import NexusConsole from './components/NexusConsole';
import LogTicker from './components/LogTicker';
import FloatingPaths from './components/FloatingPaths';
import CrowdBottleneckRouter from './components/CrowdBottleneckRouter';
import LanguageAccessibilityPanel from './components/LanguageAccessibilityPanel';
import { Shield, Radio, ShieldAlert, Cpu, AlertCircle, RefreshCw, Layers, Compass, Server, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [venues, setVenues] = useState<StadiumVenue[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('metlife');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  // Keep live UTC clock updated
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Client side logger function
  const handleAddLog = (messageText: string, level: 'info' | 'warning' | 'critical') => {
    const newLog: TelemetryLog = {
      id: `log_client_${Date.now()}`,
      venueId: selectedVenueId,
      level,
      message: messageText,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Establish connection to the WebSocket server on same host/port
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    console.log(`NEXUS: Initiating telemetry uplink to ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("NEXUS: Telemetry uplink established successfully.");
      setConnected(true);
      setReconnectCount(0);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        if (message.type === 'init') {
          setVenues(message.data.venues);
          setLogs(message.data.logs);
        } else if (message.type === 'telemetry_update') {
          // Keep active incident lists synchronized while updating basic metrics
          setVenues(prevVenues => {
            return message.data.map(incoming => {
              const existing = prevVenues.find(v => v.id === incoming.id);
              return {
                ...incoming,
                // Keep the existing incidents list to preserve status edits until we get incident events
                incidents: existing ? existing.incidents : incoming.incidents
              };
            });
          });
        } else if (message.type === 'incident_created') {
          const { venueId, incident, log } = message.data;
          setVenues(prev => prev.map(v => {
            if (v.id === venueId) {
              return {
                ...v,
                incidents: [incident, ...v.incidents]
              };
            }
            return v;
          }));
          setLogs(prev => [log, ...prev]);
        } else if (message.type === 'incident_updated') {
          const { venueId, incident, log } = message.data;
          setVenues(prev => prev.map(v => {
            if (v.id === venueId) {
              return {
                ...v,
                incidents: v.incidents.map(i => i.id === incident.id ? incident : i)
              };
            }
            return v;
          }));
          setLogs(prev => [log, ...prev]);

          // Sync selected incident details in real-time
          setSelectedIncident(prev => prev && prev.id === incident.id ? incident : prev);
        } else if (message.type === 'add_log') {
          setLogs(prev => [message.data, ...prev]);
        }
      } catch (err) {
        console.error("NEXUS: Error parsing telemetry payload:", err);
      }
    };

    ws.onclose = () => {
      console.warn("NEXUS: Telemetry uplink closed. Retrying connection...");
      setConnected(false);
      // Attempt reconnect with backoff
      setTimeout(() => {
        setReconnectCount(c => c + 1);
      }, Math.min(10000, 2000 + reconnectCount * 2000));
    };

    ws.onerror = (err) => {
      console.error("NEXUS: Uplink telemetry exception:", err);
    };

    return () => {
      ws.close();
    };
  }, [reconnectCount]);

  // Handle Dispatch Crews
  const handleDispatchUnit = (incidentId: string, unitName: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'dispatch_unit',
        data: {
          venueId: selectedVenueId,
          incidentId,
          unitName
        }
      }));
    }
  };

  // Handle Status Update
  const handleUpdateIncidentStatus = (incidentId: string, status: Incident['status']) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_incident_status',
        data: {
          venueId: selectedVenueId,
          incidentId,
          status
        }
      }));
    }
  };

  // Handle Trigger Simulated Incident
  const handleTriggerIncident = (data: { sectorName: string; title: string; severity: Incident['severity']; description: string }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'trigger_incident',
        data: {
          venueId: selectedVenueId,
          ...data
        }
      }));
    }
  };

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // Clear focus when stadium changes
  const handleSelectVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    setSelectedIncident(null);
  };

  // Keep selected incident details synced or pick the highest severity active incident to focus on
  useEffect(() => {
    if (selectedVenue) {
      if (!selectedIncident || selectedIncident.venueId !== selectedVenueId) {
        const highestActive = selectedVenue.incidents.find(i => i.status !== 'resolved');
        setSelectedIncident(highestActive || null);
      }
    }
  }, [selectedVenueId, venues]);

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 flex flex-col selection:bg-cyan-500 selection:text-neutral-950 overflow-x-hidden relative">
      
      {/* Background Animated Paths Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Modern, Premium Command Center Header */}
      <header className="border-b border-white/5 glass-panel px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0"></div>
        
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <Shield className="w-5.5 h-5.5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-display font-extrabold tracking-widest text-neutral-100 leading-none uppercase">
                NEXUS OPERATIONS CORE
              </h1>
              <span className="text-[8px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-750">
                L-3.5
              </span>
            </div>
            <p className="text-[9.5px] text-neutral-500 font-mono uppercase mt-1.5 tracking-wider">
              Logical Intelligence & Stadium Safety Command // FIFA World Cup 2026
            </p>
          </div>
        </div>

        {/* System Clock & Uplink status */}
        <div className="flex items-center gap-4 font-mono text-[9.5px]">
          <div className="hidden sm:flex flex-col items-end border-r border-neutral-800/80 pr-4">
            <span className="text-neutral-500 uppercase tracking-widest text-[8px] font-bold">OPERATIONAL CLOCK</span>
            <span className="text-neutral-300 font-bold tracking-wider mt-0.5 font-mono">
              {currentTime || 'SYNCHRONIZING...'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 bg-neutral-950/60 px-3.5 py-2 rounded-xl border border-neutral-850">
            <div className="relative flex h-2 w-2">
              {connected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                </>
              )}
            </div>
            <span className={`font-bold tracking-wider ${connected ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
              {connected ? 'CORE CONNECTED' : 'CORE OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <AnimatePresence mode="wait">
        {venues.length === 0 ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 font-mono space-y-5 relative z-10 min-h-[70vh]"
          >
            <div className="relative">
              <RefreshCw className="w-9 h-9 text-cyan-400 animate-spin" />
              <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full"></div>
            </div>
            <div className="text-center space-y-2 max-w-[340px]">
              <h2 className="text-xs text-neutral-300 font-bold uppercase tracking-widest font-display">SYNCHRONIZING TACTICAL NODE</h2>
              <p className="text-[10px] text-neutral-500 uppercase leading-relaxed">
                Loading 16 host venue databases, micro-climate sensor streams, and multi-national accessibility models...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.main 
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] w-full mx-auto relative z-10"
          >
            {/* Left Column: 16 Venues Selector Panel (Col span 3) */}
            <section className="lg:col-span-3 h-[calc(100vh-130px)] lg:sticky lg:top-[86px]">
              <VenueSelector
                venues={venues}
                selectedVenueId={selectedVenueId}
                onSelectVenue={handleSelectVenue}
              />
            </section>

            {/* Right Column: Focus Venue Telemetry & Incidents Workspace (Col span 9) */}
            <section className="lg:col-span-9 space-y-5 flex flex-col">
              {selectedVenue ? (
                <>
                  {/* Active Stadium Header Banner */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden font-mono"
                  >
                    <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none rounded-r-2xl"></div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-400" />
                        <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">// ACTIVE LOGICAL COMMAND TERMINAL</span>
                      </div>
                      <h2 className="text-xl font-display font-extrabold text-neutral-100 uppercase tracking-wide">
                        {selectedVenue.name}
                      </h2>
                      <p className="text-[10px] text-neutral-400 uppercase font-sans font-medium tracking-wide">
                        Stadium Host Hub • {selectedVenue.location}
                      </p>
                    </div>

                    {/* High level health metrics summary */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="glass-card border-white/5 rounded-xl p-3 min-w-[115px]">
                        <span className="text-neutral-500 text-[8px] block font-bold uppercase tracking-wider">INGRESS SLOTS</span>
                        <span className={`text-xs font-bold block mt-1 ${selectedVenue.gateQueueMinutes >= 35 ? 'text-rose-400' : 'text-neutral-200'}`}>
                          {selectedVenue.gateQueueMinutes}M DELAY
                        </span>
                      </div>
                      <div className="glass-card border-white/5 rounded-xl p-3 min-w-[115px]">
                        <span className="text-neutral-500 text-[8px] block font-bold uppercase tracking-wider">CROWD VOLUME</span>
                        <span className={`text-xs font-bold block mt-1 ${selectedVenue.crowdLevel >= 85 ? 'text-rose-400' : selectedVenue.crowdLevel >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {selectedVenue.crowdLevel}% CAPACITY
                        </span>
                      </div>
                      <div className="glass-card border-white/5 rounded-xl p-3 min-w-[115px]">
                        <span className="text-neutral-500 text-[8px] block font-bold uppercase tracking-wider">INFRASTRUCTURE</span>
                        <span className={`text-xs font-bold block mt-1 ${selectedVenue.mechanicalHealthPct <= 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {selectedVenue.mechanicalHealthPct}% STABLE
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Telemetry and Sectors breakdown */}
                  <TelemetryGrid venue={selectedVenue} />

                  {/* Tactical Operations Center (Incidents Control Room & NEXUS AI Readout side-by-side) */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {/* Local Incident Command */}
                    <IncidentManager
                      venue={selectedVenue}
                      onDispatchUnit={handleDispatchUnit}
                      onUpdateStatus={handleUpdateIncidentStatus}
                      onTriggerIncident={handleTriggerIncident}
                    />

                    {/* NEXUS AI Core Advisor */}
                    <NexusConsole
                      venue={selectedVenue}
                      selectedIncident={selectedIncident}
                      allIncidents={selectedVenue.incidents}
                    />
                  </div>

                  {/* Crowd routing and Language Accessibility translation panels */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <CrowdBottleneckRouter
                      venue={selectedVenue}
                      onAddLog={handleAddLog}
                    />
                    <LanguageAccessibilityPanel />
                  </div>

                  {/* Scrolling Logs and radio coms */}
                  <LogTicker logs={logs} selectedVenueId={selectedVenueId} />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center font-mono text-xs text-neutral-500 p-8 relative z-10">
                  ACTIVATE A COMMAND HUB STATION FROM THE HOST VENUE DIRECTORY WINDOW TO START TRANSMISSIONS.
                </div>
              )}
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
