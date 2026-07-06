import React, { useState } from 'react';
import { TelemetryLog } from '../types';
import { Shield, Radio, Flame, MessageSquare, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogTickerProps {
  logs: TelemetryLog[];
  selectedVenueId: string;
}

export default function LogTicker({ logs, selectedVenueId }: LogTickerProps) {
  const [filterType, setFilterType] = useState<'all' | 'venue'>('all');

  const filteredLogs = filterType === 'all' 
    ? logs 
    : logs.filter(log => log.venueId === selectedVenueId);

  const getLogLevelStyle = (level: TelemetryLog['level']) => {
    switch (level) {
      case 'critical': return 'text-rose-400 font-bold';
      case 'warning': return 'text-amber-400 font-bold';
      default: return 'text-neutral-500';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return "00:00:00";
    }
  };

  return (
    <div id="log-ticker-container" className="glass-panel border-gradient-glow rounded-2xl p-4.5 shadow-2xl font-mono flex flex-col h-[200px]">
      
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2.5 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-[10px] font-bold text-neutral-300 tracking-widest uppercase">
            TELEMETRY RECEPTIONS & SECURE COMMS
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`text-[9px] font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-all ${
              filterType === 'all' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-neutral-950/40 text-neutral-500 border border-transparent'
            }`}
          >
            HOST-WIDE
          </button>
          <button
            onClick={() => setFilterType('venue')}
            className={`text-[9px] font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-all ${
              filterType === 'venue' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-neutral-950/40 text-neutral-500 border border-transparent'
            }`}
          >
            ACTIVE STATION
          </button>
        </div>
      </div>

      {/* Log list viewport */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        <AnimatePresence initial={false}>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[10px] text-neutral-600 tracking-wider">
              AWAITING HIGH-FREQUENCY TELEMETRY FEEDS...
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              let prefix = "INFO";
              let logBg = "bg-transparent";
              let prefixStyle = "text-neutral-500 bg-neutral-950/40 border border-neutral-800/40";
              
              if (log.level === 'warning') {
                prefix = "WARN";
                logBg = "bg-amber-950/10 backdrop-blur-md border border-amber-500/10";
                prefixStyle = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
              } else if (log.level === 'critical') {
                prefix = "ALRT";
                logBg = "bg-rose-950/10 backdrop-blur-md border-l-2 border-l-rose-500/60 border-rose-500/10";
                prefixStyle = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
              }

              return (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  key={log.id}
                  className={`text-[10px] leading-relaxed py-1.5 px-2 rounded-lg flex items-center gap-3 font-mono transition-colors ${logBg}`}
                >
                  <span className="text-neutral-500 flex-shrink-0 tracking-wide font-medium">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`flex-shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${prefixStyle}`}>
                    {prefix}
                  </span>
                  <span className="text-neutral-500 uppercase flex-shrink-0 text-[9px] font-bold tracking-tight">
                    [{log.venueId}]
                  </span>
                  <span className="text-neutral-300 font-sans text-[11px] leading-relaxed flex-1">
                    {log.message}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
