import React, { useState } from 'react';
import { StadiumVenue, Sector } from '../types';
import { Shuffle, ArrowRightLeft, Users, Navigation, AlertCircle, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CrowdBottleneckRouterProps {
  venue: StadiumVenue;
  onAddLog: (message: string, level: 'info' | 'warning' | 'critical') => void;
}

export default function CrowdBottleneckRouter({ venue, onAddLog }: CrowdBottleneckRouterProps) {
  const [selectedBottleneck, setSelectedBottleneck] = useState<string>('');
  const [routed, setRouted] = useState(false);
  const [routingResults, setRoutingResults] = useState<{
    primaryRoute: { path: string; load: number; time: number; VMSCode: string };
    secondaryRoute: { path: string; load: number; time: number; VMSCode: string };
  } | null>(null);
  const [deploymentLog, setDeploymentLog] = useState<{
    path: string;
    vmsCode: string;
    timestamp: string;
  } | null>(null);

  // Find all sectors that are congested (>= 75% capacity)
  const congestedSectors = venue.sectors.filter(s => s.capacityPct >= 75);

  const handleCalculateRoute = (sectorId: string) => {
    if (!sectorId) return;
    const sector = venue.sectors.find(s => s.id === sectorId);
    if (!sector) return;

    // Select suitable alternative paths based on different sectors
    const alternatives = venue.sectors.filter(s => s.id !== sectorId && s.capacityPct < 75);
    const primaryAlt = alternatives[0] || { name: 'Gate 5 Bypass Lane', capacityPct: 45 };
    const secondaryAlt = alternatives[1] || { name: 'East Concourse Lower Deck', capacityPct: 52 };

    setRoutingResults({
      primaryRoute: {
        path: `Redirect via ${primaryAlt.name}`,
        load: primaryAlt.capacityPct + 8,
        time: 4,
        VMSCode: `VMS-ST-${sectorId.toUpperCase()}-01`
      },
      secondaryRoute: {
        path: `Reroute through ${secondaryAlt.name}`,
        load: secondaryAlt.capacityPct + 12,
        time: 7,
        VMSCode: `VMS-ST-${sectorId.toUpperCase()}-02`
      }
    });
    setRouted(true);
    setSelectedBottleneck(sectorId);
    
    onAddLog(`NEXUS Router recalculation: Alternate routes generated for congested sector [${sector.name}].`, 'info');
  };

  const handleApplyRouting = (routeType: 'primary' | 'secondary') => {
    if (!routingResults || !selectedBottleneck) return;
    const sector = venue.sectors.find(s => s.id === selectedBottleneck);
    if (!sector) return;

    const route = routeType === 'primary' ? routingResults.primaryRoute : routingResults.secondaryRoute;

    // Log the action to the server telemetry log
    onAddLog(`TACTICAL FLOW INTERCEPT: ${route.path} executed. Variable Message Signs [${route.VMSCode}] updated successfully.`, 'warning');
    
    // Custom non-blocking visual feedback instead of raw alert()
    setDeploymentLog({
      path: route.path,
      vmsCode: route.VMSCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    setRouted(false);
    setSelectedBottleneck('');
    setRoutingResults(null);

    // Auto-dismiss notification after 6 seconds
    setTimeout(() => {
      setDeploymentLog(null);
    }, 6000);
  };

  return (
    <div id="crowd-bottleneck-router" className="glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl flex flex-col h-[350px] font-mono text-xs relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/85 pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Shuffle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-display font-bold text-neutral-300 tracking-widest uppercase">
            CROWD FLOW ROUTER
          </h3>
        </div>
        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
          FLOW OPTIMIZER
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        
        {/* Custom Toast Notification System */}
        <AnimatePresence>
          {deploymentLog && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-neutral-200 relative mb-1"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-0.5 font-sans">
                <div className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span>TACTICAL DIRECTIVE LAUNCHED</span>
                  <span>•</span>
                  <span>{deploymentLog.timestamp}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-300 font-medium">
                  Bypass loop initiated: <span className="text-emerald-400 font-bold">{deploymentLog.path}</span>. Variable message board signal <span className="font-mono text-neutral-400 font-bold">[{deploymentLog.vmsCode}]</span> updated to active routing.
                </p>
              </div>
              <button 
                onClick={() => setDeploymentLog(null)}
                className="text-neutral-500 hover:text-neutral-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selector Panel */}
        <div className="glass-card p-3.5 rounded-xl space-y-3.5 border-white/5">
          <div className="space-y-1.5">
            <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">DETECTED CONGESTION VECTORS:</label>
            <select
              value={selectedBottleneck}
              onChange={(e) => {
                setSelectedBottleneck(e.target.value);
                setRouted(false);
              }}
              className="w-full glass-input rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none"
            >
              <option value="">-- SELECT CONGESTED ZONE --</option>
              {congestedSectors.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.capacityPct}% Capacity)</option>
              ))}
              {congestedSectors.length === 0 && (
                <option value="" disabled>NO ACTIVE BOTTLENECKS (FLOW IS NOMINAL)</option>
              )}
            </select>
          </div>

          <button
            onClick={() => handleCalculateRoute(selectedBottleneck)}
            disabled={!selectedBottleneck}
            className="w-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:bg-neutral-900/60 disabled:text-neutral-600 border border-cyan-500/20 rounded-lg py-2.5 font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            RESOLVE LOAD VECTORS
          </button>
        </div>

        {/* Results Panel */}
        <AnimatePresence>
          {routed && routingResults && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3.5"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                <Navigation className="w-4 h-4 animate-pulse text-amber-500" />
                <span>NEXUS PREDICTIVE ALTERNATIVE SCHEMATIC</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Primary Route */}
                <div className="border border-cyan-500/20 bg-cyan-950/15 backdrop-blur-md rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">PRIMARY FLUID VECTOR</span>
                    <h4 className="font-display font-bold text-neutral-200 text-xs mt-2.5 leading-snug">{routingResults.primaryRoute.path}</h4>
                    <div className="mt-3.5 text-[9.5px] text-neutral-400 space-y-1">
                      <div>STADIUM ACCRETION: <span className="font-bold text-cyan-400">+{routingResults.primaryRoute.load}%</span></div>
                      <div>DIVERTER TIMING: <span className="font-bold text-neutral-200">{routingResults.primaryRoute.time} MINUTES</span></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyRouting('primary')}
                    className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-widest cursor-pointer transition-colors"
                  >
                    DEPLOY COGNITIVE ROUTE
                  </button>
                </div>

                {/* Secondary Route */}
                <div className="border border-white/5 glass-card glass-card-hover rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] bg-neutral-850 text-neutral-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">SECONDARY SHIELD ROUTE</span>
                    <h4 className="font-display font-bold text-neutral-200 text-xs mt-2.5 leading-snug">{routingResults.secondaryRoute.path}</h4>
                    <div className="mt-3.5 text-[9.5px] text-neutral-400 space-y-1">
                      <div>STADIUM ACCRETION: <span className="font-bold text-neutral-300">+{routingResults.secondaryRoute.load}%</span></div>
                      <div>DIVERTER TIMING: <span className="font-bold text-neutral-200">{routingResults.secondaryRoute.time} MINUTES</span></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyRouting('secondary')}
                    className="mt-4 w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-widest cursor-pointer transition-colors"
                  >
                    DEPLOY AUXILIARY ROUTE
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
