import React, { useState } from 'react';
import { StadiumVenue } from '../types';
import { Shield, AlertTriangle, CheckCircle, Search, MapPin, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface VenueSelectorProps {
  venues: StadiumVenue[];
  selectedVenueId: string;
  onSelectVenue: (id: string) => void;
}

export default function VenueSelector({ venues, selectedVenueId, onSelectVenue }: VenueSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'usa' | 'mx' | 'can'>('all');

  const getRegion = (location: string): 'usa' | 'mx' | 'can' => {
    const loc = location.toLowerCase();
    if (loc.includes('mx') || loc.includes('mexico')) return 'mx';
    if (loc.includes('bc') || loc.includes('on') || loc.includes('canada') || loc.includes('vancouver') || loc.includes('toronto')) return 'can';
    return 'usa';
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          venue.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (regionFilter === 'all') return matchesSearch;
    return matchesSearch && getRegion(venue.location) === regionFilter;
  });

  return (
    <div id="venue-selector-container" className="flex flex-col h-full glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0"></div>
      
      <div className="flex items-center justify-between mb-5 border-b border-neutral-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Layers id="nexus-shield-icon" className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 id="selector-title" className="text-xs font-display tracking-widest text-neutral-300 font-bold uppercase">
            VENUES MATRIX ({venues.length})
          </h2>
        </div>
        <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          LIVE TELEMETRY
        </span>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            id="venue-search-input"
            type="text"
            placeholder="Query station databases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2 pl-9 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none font-mono"
          />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {(['all', 'usa', 'mx', 'can'] as const).map(region => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={`text-[9px] font-mono font-bold uppercase py-1.5 border rounded-lg transition-all cursor-pointer ${
                regionFilter === region
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'bg-neutral-950/40 border-neutral-800/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700/80'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Venue List */}
      <div id="venue-scroll-list" className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {filteredVenues.length === 0 ? (
          <div className="text-center py-12 text-xs font-mono text-neutral-600">
            NO LOGICAL VENUES MATCHING SPECIFICATION
          </div>
        ) : (
          filteredVenues.map((venue, idx) => {
            const activeIncidentCount = venue.incidents.filter(i => i.status !== 'resolved').length;
            const criticalIncidentCount = venue.incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
            const isSelected = venue.id === selectedVenueId;
            
            // Determine status colors
            let statusBorderColor = 'border-white/5';
            let statusBg = 'glass-card glass-card-hover';

            if (isSelected) {
              statusBorderColor = 'border-cyan-500/35';
              statusBg = 'bg-cyan-950/15 border-l-2 border-l-cyan-400 shadow-[0_4px_25px_rgba(6,182,212,0.08)]';
            } else if (criticalIncidentCount > 0) {
              statusBorderColor = 'border-rose-500/20';
              statusBg = 'bg-rose-950/10 hover:bg-rose-950/25 hover:border-rose-500/35 transition-all';
            } else if (activeIncidentCount > 0) {
              statusBorderColor = 'border-amber-500/20';
              statusBg = 'bg-amber-950/10 hover:bg-amber-950/25 hover:border-amber-500/35 transition-all';
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                key={venue.id}
                id={`venue-card-${venue.id}`}
                onClick={() => onSelectVenue(venue.id)}
                className={`border p-3.5 rounded-xl cursor-pointer ${statusBorderColor} ${statusBg} relative overflow-hidden`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none"></div>
                )}
                
                <div className="flex items-start justify-between gap-2.5 mb-2">
                  <div>
                    <h3 className={`text-xs font-display font-bold tracking-wide transition-colors ${isSelected ? 'text-cyan-400' : 'text-neutral-200'}`}>
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-500 font-mono">
                      <MapPin className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                      <span>{venue.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {criticalIncidentCount > 0 ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    ) : activeIncidentCount > 0 ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                </div>

                {/* Micro Telemetry Grid */}
                <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-neutral-800/50 text-[9px] font-mono">
                  <div>
                    <span className="text-neutral-500 block">OCCUPANCY</span>
                    <span className={`font-bold ${venue.crowdLevel >= 85 ? 'text-rose-400' : venue.crowdLevel >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {venue.crowdLevel}%
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">QUEUES</span>
                    <span className={`font-bold ${venue.gateQueueMinutes >= 35 ? 'text-rose-400' : 'text-neutral-300'}`}>
                      {venue.gateQueueMinutes}M
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">INCIDENTS</span>
                    <span className={`font-bold ${activeIncidentCount > 0 ? 'text-amber-400 font-bold' : 'text-neutral-600'}`}>
                      {activeIncidentCount} ACTIVE
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
