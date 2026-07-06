import React, { useState } from 'react';
import { StadiumVenue, Incident } from '../types';
import { AlertCircle, ShieldAlert, CheckCircle, Clock, Send, Users, PenTool as Tool, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IncidentManagerProps {
  venue: StadiumVenue;
  onDispatchUnit: (incidentId: string, unitName: string) => void;
  onUpdateStatus: (incidentId: string, status: Incident['status']) => void;
  onTriggerIncident: (data: { sectorName: string; title: string; severity: Incident['severity']; description: string }) => void;
}

const RESPONSE_TEAMS = [
  "Steward Division Alpha",
  "Auxiliary Gate-Control Stewards",
  "Rapid Response Medical Unit 2",
  "Crisis Medical Team Delta",
  "Engineering Unit Echo (Lifts/HVAC)",
  "Heavy Mechanical Engineering Division",
  "Transit Hub Dispatch Patrol",
  "Emergency Security Unit 4"
];

export default function IncidentManager({ venue, onDispatchUnit, onUpdateStatus, onTriggerIncident }: IncidentManagerProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'trigger'>('queue');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [assignedUnit, setAssignedUnit] = useState(RESPONSE_TEAMS[0]);

  // Form states for manual incident creation
  const [newTitle, setNewTitle] = useState('');
  const [newSector, setNewSector] = useState(venue.sectors[0]?.name || '');
  const [newSeverity, setNewSeverity] = useState<Incident['severity']>('high');
  const [newDesc, setNewDesc] = useState('');

  const activeIncidents = venue.incidents;

  const handleDispatch = (incidentId: string) => {
    onDispatchUnit(incidentId, assignedUnit);
    setSelectedIncidentId(null);
  };

  const handleTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    onTriggerIncident({
      sectorName: newSector,
      title: newTitle,
      severity: newSeverity,
      description: newDesc
    });
    // Reset form
    setNewTitle('');
    setNewDesc('');
    setActiveTab('queue');
  };

  const getSeverityStyle = (sev: Incident['severity']) => {
    switch (sev) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default: return 'bg-neutral-850/60 text-neutral-400 border-neutral-800/40';
    }
  };

  const getStatusIcon = (status: Incident['status']) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'contained': return <UserCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'dispatched': return <Users className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      default: return <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />;
    }
  };

  return (
    <div id="incident-manager-container" className="glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl flex flex-col h-[480px]">
      
      {/* Menu Header Tabs */}
      <div className="flex border-b border-neutral-800/80 pb-3 mb-4 flex-shrink-0 gap-4">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 font-display text-xs uppercase py-2 font-bold border-b-2 transition-all cursor-pointer text-center tracking-widest ${
            activeTab === 'queue' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          INCIDENTS STREAM ({activeIncidents.length})
        </button>
        <button
          onClick={() => setActiveTab('trigger')}
          className={`flex-1 font-display text-xs uppercase py-2 font-bold border-b-2 transition-all cursor-pointer text-center tracking-widest ${
            activeTab === 'trigger' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          SIMULATE CRISIS
        </button>
      </div>

      {/* Tab contents */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'queue' ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {activeIncidents.length === 0 ? (
                <div className="text-center py-24 text-xs font-mono text-neutral-500 flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8 text-neutral-700" />
                  <span>STADIUM ALL CLEAR. NO DETECTED INCIDENTS.</span>
                </div>
              ) : (
                activeIncidents.map(inc => {
                  const isPendingDispatch = selectedIncidentId === inc.id;

                  return (
                    <motion.div
                      layout
                      key={inc.id}
                      id={`incident-item-${inc.id}`}
                      className={`border rounded-xl p-4 glass-card glass-card-hover relative font-mono text-xs border-white/5`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] uppercase border px-2 py-0.5 rounded-full font-bold tracking-wider ${getSeverityStyle(inc.severity)}`}>
                            {inc.severity}
                          </span>
                          <span className="text-[9px] text-neutral-500">
                            {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-neutral-400">
                          {getStatusIcon(inc.status)}
                          <span className="tracking-wider">{inc.status}</span>
                        </div>
                      </div>

                      <h4 className="font-display font-bold text-neutral-100 text-sm mb-1.5">
                        {inc.title}
                      </h4>
                      
                      <span className="text-[10px] text-cyan-400 block mb-2 font-mono font-semibold uppercase tracking-wider">
                        SECTOR VECTOR: {inc.sectorName}
                      </span>

                      <p className="text-neutral-400 text-[11px] leading-relaxed mb-3.5 font-sans">
                        {inc.description}
                      </p>

                      {inc.assignedUnit && (
                        <div className="bg-neutral-950/60 p-2.5 border border-neutral-800/40 rounded-lg mb-3 text-[10px] text-neutral-300 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-cyan-500" />
                          <div>
                            <span className="text-neutral-500 block text-[8px] font-bold uppercase tracking-wider">ASSIGNED DEPLOYMENT VECTOR:</span>
                            <span className="font-bold text-neutral-200">{inc.assignedUnit}</span>
                          </div>
                        </div>
                      )}

                      {/* Operational Commands */}
                      <div className="flex flex-wrap gap-2 pt-2.5 border-t border-neutral-800/40">
                        {inc.status === 'open' && !isPendingDispatch && (
                          <button
                            onClick={() => setSelectedIncidentId(inc.id)}
                            className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[9px] font-bold py-1.5 px-3 rounded-lg transition-colors uppercase flex items-center gap-1.5 cursor-pointer font-mono tracking-wider"
                          >
                            <Send className="w-3 h-3" /> DISPATCH TEAM
                          </button>
                        )}

                        {inc.status === 'dispatched' && (
                          <button
                            onClick={() => onUpdateStatus(inc.id, 'contained')}
                            className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-[9px] font-bold py-1.5 px-3 rounded-lg transition-colors uppercase flex items-center gap-1.5 cursor-pointer font-mono tracking-wider"
                          >
                            <UserCheck className="w-3 h-3" /> CONTAIN THREAT
                          </button>
                        )}

                        {(inc.status === 'dispatched' || inc.status === 'contained') && (
                          <button
                            onClick={() => onUpdateStatus(inc.id, 'resolved')}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[9px] font-bold py-1.5 px-3 rounded-lg transition-colors uppercase flex items-center gap-1.5 cursor-pointer font-mono tracking-wider"
                          >
                            <CheckCircle className="w-3 h-3" /> RESOLVE INCIDENT
                          </button>
                        )}
                      </div>

                      {/* Dispatch Sub-Form */}
                      {isPendingDispatch && (
                        <div className="mt-3.5 p-3.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl space-y-3">
                          <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">SELECT TACTICAL VECTOR:</label>
                          <select
                            value={assignedUnit}
                            onChange={(e) => setAssignedUnit(e.target.value)}
                            className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none"
                          >
                            {RESPONSE_TEAMS.map(team => (
                              <option key={team} value={team}>{team}</option>
                            ))}
                          </select>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleDispatch(inc.id)}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[9px] py-1.5 px-3 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              CONFIRM DISPATCH
                            </button>
                            <button
                              onClick={() => setSelectedIncidentId(null)}
                              className="bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold text-[9px] py-1.5 px-3 rounded-lg uppercase tracking-wider transition-colors hover:bg-neutral-850 cursor-pointer"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          ) : (
            /* Trigger Incident form */
            <motion.form
              key="trigger"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleTriggerSubmit}
              className="space-y-4 font-mono text-xs"
            >
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl mb-1">
                <span className="text-[10px] text-rose-400 block font-bold uppercase tracking-wider mb-1">// SYSTEM SIMULATION PORT</span>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  Instigating simulated breakdowns down-grades stadium performance coefficients, injects real-time events, and forces operational alert procedures.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">INCIDENT DESCRIPTIVE HEADLINE:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turnstile Power Cascade Gate D"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full glass-input rounded-lg px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">SECTOR ZONE:</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full glass-input rounded-lg px-2.5 py-2 text-xs text-neutral-200 focus:outline-none"
                  >
                    {venue.sectors.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">SEVERITY INDEX:</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Incident['severity'])}
                    className="w-full glass-input rounded-lg px-2.5 py-2 text-xs text-neutral-200 focus:outline-none"
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="critical">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">CRITICAL LOGISTICS EXPLANATION:</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain structural breakdown context & resource hazards..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full glass-input rounded-lg px-3.5 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold border border-rose-500/20 rounded-xl py-3 text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-rose-950/20"
              >
                DEPLOY SIMULATION EVENT
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
