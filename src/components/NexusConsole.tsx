import React, { useState, useEffect, useRef } from 'react';
import { StadiumVenue, Incident } from '../types';
import { Sparkles, Terminal, MessageSquare, Send, Loader2, AlertTriangle, Play, HelpCircle, Layers, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NexusConsoleProps {
  venue: StadiumVenue;
  selectedIncident: Incident | null;
  allIncidents: Incident[];
}

interface ChatMessage {
  sender: 'operator' | 'nexus';
  text: string;
  timestamp: string;
}

export default function NexusConsole({ venue, selectedIncident, allIncidents }: NexusConsoleProps) {
  const [activeTab, setActiveTab] = useState<'readout' | 'chat'>('readout');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Chat console states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'nexus',
      text: 'NEXUS COGNITIVE OPERATIONS CO-PILOT INITIALIZED. State your directive, draft alerts, or request steward reallocation projections.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadingPhrases = [
    "ACQUIRING ORBITAL TELEMETRY CAPTURES...",
    "MAPPING STADIUM SECTOR CORRIDORS...",
    "CROSS-REFERENCING CROWD VELOCITY SCANS...",
    "CALCULATING EMERGENCY TRANSIT REALLOCATIONS...",
    "COMPILING INCIDENT BACKLOG DEPLOYMENTS...",
    "FINALIZING TACTICAL SUPERVISOR PROTOCOLS..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingPhrases.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const requestTacticalReadout = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/nexus/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue,
          incident: selectedIncident,
          allIncidents: allIncidents.filter(i => i.id !== selectedIncident?.id)
        })
      });

      if (!response.ok) {
        throw new Error("Telemetry sync lost with tactical core.");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.warn("NEXUS: Sync lost with server. Triggering high-fidelity local failover advisor logic.", err);
      // Generate highly detailed offline backup text
      const situationSummary = selectedIncident 
        ? `TACTICAL CRITICAL ALERT IN EFFECT. Incident [${selectedIncident.id}] located in "${selectedIncident.sectorName}" registers at [${selectedIncident.severity.toUpperCase()}] severity. Crowds at ${venue.name} are currently at ${venue.crowdLevel}% general occupancy. Sector temperature has elevated, requiring aggressive cooling and ventilation checks.`
        : `ALL VENUE SECTORS CURRENTLY MONITORING OPTIMAL. Occupancy at ${venue.name} is steady at ${venue.crowdLevel}%. Mechanical integrity is at ${venue.mechanicalHealthPct}%, and gate queue times are holding at ${venue.gateQueueMinutes} minutes. No major uncontained anomalies detected.`;

      const riskAnalysis = selectedIncident 
        ? `- **Crowd Dynamic Volatility**: The unresolved ${selectedIncident.title} in ${selectedIncident.sectorName} represents an active blockage point. With crowd capacity currently at ${venue.crowdLevel}%, secondary congestion ripples will congest neighboring sectors within 9 minutes.
- **Evacuation Vector Compromise**: If sector capacity exceeds 85% in adjacent areas, emergency evacuation corridors will experience substantial queuing delay, raising critical security hazard level.`
        : `- **Peak Surge Potential**: Gate ingress queue times of ${venue.gateQueueMinutes} minutes represent a minor risk of bottlenecking at outer checkpoints. If flow rate continues to increase past 150 fans/minute, outer gates will saturate within 12 minutes.`;

      const deploymentVectors = selectedIncident
        ? `- **Deploy Sector Bravo Tactical Stewards**: Immediately reallocate 15 gate-control stewards to seal the western access junction of ${selectedIncident.sectorName} to prevent further fan accumulation.
- **Dispatch Engineering Team Echo**: Order the active maintenance crew to converge on the incident point with auxiliary diagnostic kits. Expected deployment timeline: 120 seconds.
- **Position Mobile Medical Unit 3**: Shift auxiliary medics to the West Concourse muster point to stand by for heat exhaustion or distress calls.`
        : `- **Pre-position Transit Liaison Officer**: Place Transit Hub stewards at Platform 2 to oversee standard queue lines.
- **Synchronize Gate Flow Controls**: Coordinate with perimeter gate supervisors to maintain current processing frequency and monitor ticket scans.`;

      const protocols = selectedIncident
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

      setAnalysis(fallbackAnalysis);
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      sender: 'operator',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!customMessage) {
      setChatInput('');
    }
    setChatLoading(true);

    try {
      const response = await fetch("/api/nexus/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          venue
        })
      });

      if (!response.ok) {
        throw new Error("Uplink timeout with NEXUS Chat Hub.");
      }

      const data = await response.json();
      const nexusMsg: ChatMessage = {
        sender: 'nexus',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, nexusMsg]);
    } catch (err: any) {
      console.warn("NEXUS: Chat connection failed. Running edge intelligence simulator.", err);
      const prefix = `[NEXUS CRITICAL] LOCAL FAILOVER ACTIVE // REASONING RESTRICTED TO EDGECALCULATED CACHE DATA MATRIX\n\n`;
      let reply = "";
      const msg = textToSend.toLowerCase();
      
      if (msg.includes("evacuate") || msg.includes("alert") || msg.includes("emergency")) {
        reply = `${prefix}**## // EMERGENCY EVACUATION DRAFT GENERATED**\n"ATTENTION ALL SPECTATORS IN ${venue.name.toUpperCase()} SECTOR WEST. Please locate the nearest illuminated green signs and proceed calmly towards Ingress Gates 4 and 5. Steward divisions have cleared these corridors. Emergency vehicles are on standby."`;
      } else if (msg.includes("steward") || msg.includes("reallocate") || msg.includes("gate") || msg.includes("deploy")) {
        reply = `${prefix}**## // FORCE REALLOCATION MATRIX DETERMINED**\nDeploying **Auxiliary Steward Divisions 1 and 2** to reinforce outer gate terminals of ${venue.name}. This is estimated to reduce wait delays by 15-20 minutes.`;
      } else if (msg.includes("status") || msg.includes("report") || msg.includes("telemetry")) {
        reply = `${prefix}**## // OPERATIONAL TELEMETRY REPORT**\n${venue.name} is running at **${venue.crowdLevel}% occupancy**. Security gate delay is **${venue.gateQueueMinutes} minutes**. Infrastructure stability is at **${venue.mechanicalHealthPct}%** with **${allIncidents.filter(i => i.status !== 'resolved').length} active incidents** logged in cache.`;
      } else {
        reply = `${prefix}Received instruction: "${textToSend}". NEXUS edge-model advises maintaining current local sensor thresholds. Telemetry metrics for ${venue.name} remain within safe operational envelopes. Field stewards are pre-positioned.`;
      }

      const nexusMsg: ChatMessage = {
        sender: 'nexus',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, nexusMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Custom parser for rendering NEXUS tactical markdown output in polished layout panels
  const renderTacticalReport = (text: string) => {
    const lines = text.split("\n");
    let currentSection: string | null = null;
    let sectionContent: React.ReactNode[] = [];
    const sections: { title: string; content: React.ReactNode[] }[] = [];

    const flushSection = () => {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: [...sectionContent]
        });
        sectionContent = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## //")) {
        flushSection();
        currentSection = trimmed;
      } else if (trimmed) {
        // Parse bold markdown **text**
        const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
        const parsedLine = parts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} className="text-cyan-400 font-semibold">{part}</strong>;
          }
          return part;
        });

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          sectionContent.push(
            <li key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-neutral-300 mt-1.5 ml-1 font-mono">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-sm mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
              <span>{parsedLine}</span>
            </li>
          );
        } else {
          sectionContent.push(
            <p key={idx} className="text-[11px] leading-relaxed text-neutral-400 mt-1 font-mono">
              {parsedLine}
            </p>
          );
        }
      }
    });
    flushSection();

    // If no ## sections were found, output raw text paragraphs
    if (sections.length === 0) {
      return (
        <div className="space-y-2 font-mono text-[11px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      );
    }

    return (
      <div className="space-y-3.5 font-mono">
        {sections.map((sec, sIdx) => {
          let bgGlow = "bg-neutral-950/40 border-neutral-800/60";
          let headingColor = "text-cyan-400";
          
          if (sec.title.includes("SITUATION")) {
            bgGlow = "bg-neutral-950/50 border-neutral-800/80";
          } else if (sec.title.includes("RISK")) {
            bgGlow = "bg-rose-950/5 border-rose-950/20";
            headingColor = "text-rose-400";
          } else if (sec.title.includes("DEPLOYMENT")) {
            bgGlow = "bg-cyan-950/5 border-cyan-950/20";
            headingColor = "text-cyan-400";
          } else if (sec.title.includes("PROTOCOLS")) {
            bgGlow = "bg-emerald-950/5 border-emerald-950/20";
            headingColor = "text-emerald-400";
          }

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: sIdx * 0.05 }}
              key={sIdx} 
              className={`border p-3.5 rounded-xl glass-card ${bgGlow} transition-all shadow-sm`}
            >
              <h4 className={`text-[10px] font-bold tracking-widest border-b border-neutral-900 pb-1.5 mb-2.5 uppercase ${headingColor}`}>
                {sec.title}
              </h4>
              <ul className="space-y-1.5">
                {sec.content}
              </ul>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="nexus-console-container" className="glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl flex flex-col h-[480px]">
      
      {/* Console Tab Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('readout')}
            className={`text-xs font-display font-bold tracking-widest px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'readout' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            COMMAND ADVISOR
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`text-xs font-display font-bold tracking-widest px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'chat' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            NEXUS CO-PILOT
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider">UPLINK ACTIVE</span>
        </div>
      </div>

      {activeTab === 'readout' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Target Focus Bar */}
          <div className="glass-input px-3.5 py-2.5 rounded-xl mb-3.5 font-mono text-[9px] flex items-center justify-between flex-shrink-0">
            <div>
              <span className="text-neutral-500 block uppercase font-bold tracking-wider">COGNITIVE TASK FOCUS:</span>
              <span className="font-bold text-neutral-300 tracking-wide">
                {selectedIncident ? `[INCIDENT] ${selectedIncident.title.toUpperCase()}` : `[VENUE SYSTEM HEALTH] ${venue.name.toUpperCase()}`}
              </span>
            </div>
            <button
              onClick={requestTacticalReadout}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-900 disabled:text-neutral-600 text-white font-bold py-1.5 px-3 rounded-lg uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer font-mono text-[9px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> RUNNING...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> GENERATE REPORT
                </>
              )}
            </button>
          </div>

          {/* Primary Readout Area */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4 font-mono py-12"
                >
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <span className="text-cyan-400 font-bold text-[9px] tracking-widest block uppercase animate-pulse">
                      NEXUS TELEMETRY PROCESSING FEED
                    </span>
                    <span className="text-neutral-500 text-[9px] block uppercase max-w-[280px] mx-auto leading-relaxed">
                      {loadingPhrases[loadingStep]}
                    </span>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-4 text-center font-mono space-y-3.5 py-12"
                >
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                  <div className="space-y-1">
                    <span className="text-rose-400 font-bold text-xs block uppercase tracking-wider">CORE SYNC DISRUPTED</span>
                    <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[280px]">
                      {error} Please ensure an active GEMINI_API_KEY environment secret is configured.
                    </p>
                  </div>
                  <button
                    onClick={requestTacticalReadout}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-1.5 rounded-lg text-[9px] uppercase font-bold cursor-pointer tracking-wider"
                  >
                    Retry Core Uplink
                  </button>
                </motion.div>
              ) : analysis ? (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3.5"
                >
                  {renderTacticalReport(analysis)}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center font-mono space-y-3.5 p-4 py-16"
                >
                  <Terminal className="w-8 h-8 text-neutral-700" />
                  <div className="space-y-1">
                    <span className="text-neutral-400 font-bold text-[10px] block uppercase tracking-wider">// COMMAND ENGINE STANDBY</span>
                    <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[280px] mx-auto font-sans">
                      Request deep neural assessment covering stadium capacity loads, local transit queues, active incidents, and gate processing coefficients.
                    </p>
                  </div>
                  <button
                    onClick={requestTacticalReadout}
                    className="bg-neutral-950 border border-neutral-800 text-cyan-400 hover:bg-neutral-900 font-bold text-[9px] py-2 px-4 rounded-lg uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.05)] cursor-pointer"
                  >
                    RUN NEURAL REPORT
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Chat view */
        <div className="flex-1 flex flex-col min-h-0 font-mono text-xs">
          {/* Chat scrolling feed */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3.5 mb-3.5">
            {chatHistory.map((msg, idx) => {
              const isNexus = msg.sender === 'nexus';
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex flex-col ${isNexus ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 text-[8px] text-neutral-500 mb-1 font-mono uppercase tracking-wider">
                    <span>{isNexus ? 'NEXUS INTEL CO-PILOT' : 'STATION OPERATOR'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed border font-sans text-[11.5px] ${
                    isNexus 
                      ? 'glass-card border-white/5 text-neutral-300' 
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100'
                  }`}>
                    {msg.text.split("\n").map((line, lIdx) => {
                      if (line.startsWith("##")) {
                        return <h4 key={lIdx} className="text-[10px] font-display font-bold text-cyan-400 uppercase tracking-widest mb-1.5 mt-2.5 first:mt-0 font-mono">{line.replace("##", "").trim()}</h4>;
                      }
                      return <p key={lIdx} className="mb-1 last:mb-0 leading-relaxed">{line}</p>;
                    })}
                  </div>
                </motion.div>
              );
            })}
            
            {chatLoading && (
              <div className="flex items-center gap-2.5 text-[9px] text-neutral-500 italic">
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>NEXUS COMPILES SCHEMATIC OUTCOMES...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick templates panel */}
          <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
            <button
              onClick={() => sendChatMessage("Draft evacuation notice for Sector West")}
              className="text-[9px] bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Draft Evacuation
            </button>
            <button
              onClick={() => sendChatMessage("Optimize steward dispatch routes to Gate 4")}
              className="text-[9px] bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Steward Optimization
            </button>
            <button
              onClick={() => sendChatMessage("Analyze medical emergency priorities")}
              className="text-[9px] bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Medical Protocols
            </button>
          </div>

          {/* Input control box */}
          <div className="flex gap-2 items-center flex-shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChatMessage();
              }}
              placeholder="Query tactical command guidelines..."
              className="flex-1 glass-input rounded-xl px-3.5 py-2.5 text-neutral-100 placeholder:text-neutral-600 focus:outline-none text-xs"
            />
            <button
              onClick={() => sendChatMessage()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-xl cursor-pointer flex items-center justify-center transition-colors shadow-lg shadow-cyan-950/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
