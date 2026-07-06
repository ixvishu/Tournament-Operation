import React from 'react';
import { StadiumVenue, Sector } from '../types';
import { Users, Clock, Bus, Cpu, Thermometer, ArrowUpRight, Gauge } from 'lucide-react';
import { motion } from 'motion/react';

interface TelemetryGridProps {
  venue: StadiumVenue;
}

export default function TelemetryGrid({ venue }: TelemetryGridProps) {
  // Helpers for styling
  const getCapacityColor = (pct: number) => {
    if (pct >= 90) return { text: 'text-rose-400', border: 'border-rose-900/50', bg: 'bg-rose-950/10' };
    if (pct >= 80) return { text: 'text-amber-400', border: 'border-amber-900/50', bg: 'bg-amber-950/10' };
    if (pct >= 70) return { text: 'text-orange-400', border: 'border-orange-950/30', bg: 'bg-orange-950/10' };
    return { text: 'text-emerald-400', border: 'border-emerald-950/50', bg: 'bg-emerald-950/10' };
  };

  const getStatusLabel = (status: Sector['status']) => {
    switch (status) {
      case 'critical': return 'CRITICAL';
      case 'warning': return 'WARNING';
      case 'congested': return 'CONGESTED';
      default: return 'NOMINAL';
    }
  };

  return (
    <div id="telemetry-grid-container" className="space-y-5">
      {/* Real-time Telemetry Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Occupancy card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          id="metric-occupancy" 
          className="glass-card glass-card-hover rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden group"
        >
          <div className="absolute right-3.5 top-3.5 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-all">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[9px] text-neutral-500 block uppercase tracking-widest font-bold">// CROWD LOAD</span>
          <div className="flex items-baseline gap-1 mt-3">
            <span className={`text-2xl font-display font-bold tracking-tight ${getCapacityColor(venue.crowdLevel).text}`}>
              {venue.crowdLevel}%
            </span>
            <span className="text-xs text-neutral-500 font-sans">/ CAPACITY</span>
          </div>
          <div className="mt-3 text-[10px] text-neutral-400 flex items-center justify-between border-t border-neutral-800/40 pt-2.5">
            <span>MAX CAP:</span>
            <span className="font-bold text-neutral-300">{venue.capacity.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Gate queue card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          id="metric-gates" 
          className="glass-card glass-card-hover rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden group"
        >
          <div className="absolute right-3.5 top-3.5 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-all">
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[9px] text-neutral-500 block uppercase tracking-widest font-bold">// SECURITY INGRESS</span>
          <div className="flex items-baseline gap-1 mt-3">
            <span className={`text-2xl font-display font-bold tracking-tight ${venue.gateQueueMinutes >= 35 ? 'text-rose-400' : venue.gateQueueMinutes >= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {venue.gateQueueMinutes}
            </span>
            <span className="text-xs text-neutral-500 font-sans">MIN DELAY</span>
          </div>
          <div className="mt-3 text-[10px] text-neutral-400 flex items-center justify-between border-t border-neutral-800/40 pt-2.5">
            <span>FLOW INTEGRITY:</span>
            <span className="font-bold text-neutral-300">
              {venue.gateQueueMinutes >= 35 ? 'CONGESTED' : 'OPTIMAL'}
            </span>
          </div>
        </motion.div>

        {/* Transit delay card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          id="metric-transit" 
          className="glass-card glass-card-hover rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden group"
        >
          <div className="absolute right-3.5 top-3.5 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-all">
            <Bus className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[9px] text-neutral-500 block uppercase tracking-widest font-bold">// TRANSIT NETWORK</span>
          <div className="flex items-baseline gap-1 mt-3">
            <span className={`text-2xl font-display font-bold tracking-tight ${venue.transitDelayMinutes >= 25 ? 'text-rose-400' : venue.transitDelayMinutes >= 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {venue.transitDelayMinutes}
            </span>
            <span className="text-xs text-neutral-500 font-sans">MIN QUEUE</span>
          </div>
          <div className="mt-3 text-[10px] text-neutral-400 flex items-center justify-between border-t border-neutral-800/40 pt-2.5">
            <span>FREQUENCY BOOST:</span>
            <span className={`font-bold ${venue.transitDelayMinutes >= 25 ? 'text-cyan-400 animate-pulse' : 'text-neutral-300'}`}>
              {venue.transitDelayMinutes >= 25 ? '+35% ACTIVE' : 'NOMINAL'}
            </span>
          </div>
        </motion.div>

        {/* Mechanical health card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          id="metric-mechanical" 
          className="glass-card glass-card-hover rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden group"
        >
          <div className="absolute right-3.5 top-3.5 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-all">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[9px] text-neutral-500 block uppercase tracking-widest font-bold">// HARDWARE HEALTH</span>
          <div className="flex items-baseline gap-1 mt-3">
            <span className={`text-2xl font-display font-bold tracking-tight ${venue.mechanicalHealthPct <= 75 ? 'text-rose-400' : venue.mechanicalHealthPct <= 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {venue.mechanicalHealthPct}%
            </span>
            <span className="text-xs text-neutral-500 font-sans">ONLINE</span>
          </div>
          <div className="mt-3 text-[10px] text-neutral-400 flex items-center justify-between border-t border-neutral-800/40 pt-2.5">
            <span>ACTIVE ALERTS:</span>
            <span className={`font-bold ${venue.medicalAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-neutral-300'}`}>
              {venue.medicalAlertsCount > 0 ? `${venue.medicalAlertsCount} ALERT` : 'ZERO'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Sector Layout Map */}
      <div className="glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-xs font-display font-bold text-neutral-300 tracking-widest">
              SECTORS BREAKDOWN & THERMAL TELEMETRY
            </h3>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span> NOMINAL
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-orange-400 rounded-sm shadow-[0_0_8px_rgba(251,146,60,0.4)]"></span> CONGESTED
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span> CRITICAL
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venue.sectors.map((sector, sIdx) => {
            const styles = getCapacityColor(sector.capacityPct);
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: sIdx * 0.04 }}
                key={sector.id}
                id={`sector-card-${sector.id}`}
                className={`border rounded-xl p-4 glass-card glass-card-hover font-mono ${styles.border} group`}
              >
                <div className="flex items-start justify-between border-b border-neutral-800/40 pb-2.5 mb-3">
                  <div>
                    <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">{sector.id.replace('_', ' ')}</span>
                    <h4 className="text-xs font-display font-bold text-neutral-200 mt-0.5">{sector.name}</h4>
                  </div>
                  <span className={`text-[8px] border px-2 py-0.5 rounded-full font-bold tracking-wider ${styles.text} ${styles.border} ${styles.bg}`}>
                    {getStatusLabel(sector.status)}
                  </span>
                </div>

                <div className="space-y-2 text-[11px] text-neutral-400">
                  <div className="flex justify-between items-center">
                    <span>CAPACITY LOAD:</span>
                    <span className={`font-bold ${styles.text}`}>{sector.capacityPct}%</span>
                  </div>
                  
                  {/* Elegant micro progress bar */}
                  <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-900 p-[1px]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sector.capacityPct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`h-full rounded-full ${
                        sector.capacityPct >= 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : sector.capacityPct >= 80 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : sector.capacityPct >= 70 ? 'bg-orange-400' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Thermometer className="w-3.5 h-3.5 text-neutral-500" /> CLIMATE SENSOR:
                    </span>
                    <span className={`font-bold font-mono ${sector.temperatureF >= 88 ? 'text-amber-400' : 'text-neutral-300'}`}>
                      {sector.temperatureF}°F
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500" /> PROCESSING FLOW:
                    </span>
                    <span className="font-bold text-neutral-200">{sector.flowRate} / MIN</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
