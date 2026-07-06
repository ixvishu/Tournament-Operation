import React, { useState } from 'react';
import { Globe, Accessibility, Volume2, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish (México/España)', translation: 'El ascensor/escalera mecánica de la zona oeste está bloqueado. Use la entrada este.' },
  { code: 'pt', name: 'Portuguese (Brasil)', translation: 'O elevador da ala oeste está inativo. Siga para a entrada leste.' },
  { code: 'ja', name: 'Japanese (日本)', translation: '西コンコースのエスカレーターは現在停止しています。東ゲートをご利用ください。' },
  { code: 'fr', name: 'French (France/Canada)', translation: "L'escalator du hall Ouest est arrêté. Veuillez emprunter l'entrée Est." },
  { code: 'de', name: 'German (Deutschland)', translation: 'Rolltreppe im West-Korridor ausgefallen. Bitte nutzen Sie den Ost-Eingang.' },
  { code: 'ar', name: 'Arabic (العربية)', translation: 'السلم الكهربائي للممر الغربي معطل. يرجى التوجّه إلى البوابة الشرقية.' },
];

export default function LanguageAccessibilityPanel() {
  const [announcement, setAnnouncement] = useState('West Concourse escalator is currently out of service. Please bypass via East Gate corridor.');
  const [targetLang, setTargetLang] = useState('es');
  const [translatedText, setTranslatedText] = useState('El ascensor/escalera mecánica de la zona oeste está bloqueado. Use la entrada este.');
  const [statusText, setStatusText] = useState('');
  const [speaking, setSpeaking] = useState(false);

  const handleTranslate = () => {
    const selected = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
    if (selected) {
      setTranslatedText(selected.translation);
      setStatusText('TRANSLATION SYNCHRONIZED SUCCESSFULLY');
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const handleSpeechMock = () => {
    setSpeaking(true);
    setStatusText('BROADCASTING LOCAL TRANSLATED VOX...');
    setTimeout(() => {
      setSpeaking(false);
      setStatusText('BROADCAST COMPLETE');
      setTimeout(() => setStatusText(''), 3000);
    }, 2500);
  };

  return (
    <div id="language-accessibility-panel" className="glass-panel border-gradient-glow rounded-2xl p-5 shadow-2xl flex flex-col h-[350px] font-mono text-xs relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/85 pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-display font-bold text-neutral-300 tracking-widest uppercase">
            ACCESSIBILITY PORTAL
          </h3>
        </div>
        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
          48 NATIONS SYNC
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3.5">
        
        {/* Input area */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">OPERATOR CENTRAL ANNOUNCEMENT:</label>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={2}
            className="w-full glass-input rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none resize-none font-sans"
          />
        </div>

        {/* Translation configuration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] text-neutral-500 uppercase block font-bold tracking-wider">TARGET FAN LANGUAGE:</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full glass-input rounded-lg px-2.5 py-2 text-xs text-neutral-200 focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleTranslate}
              className="w-full bg-neutral-950/60 hover:bg-neutral-900 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg py-2 font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              TRANSLATE SIGNAGE
            </button>
          </div>
        </div>

        {/* Output translation container */}
        <div className="glass-card p-4 rounded-xl relative overflow-hidden border-white/5">
          <span className="text-[8.5px] text-neutral-500 uppercase block font-bold mb-2 tracking-wider">TRANSLATED SIGNAGE TEXT:</span>
          <p className="text-[11.5px] text-neutral-200 leading-relaxed font-semibold italic font-sans">
            "{translatedText}"
          </p>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-900">
            <button
              onClick={handleSpeechMock}
              disabled={speaking}
              className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-lg px-3.5 py-1.5 text-[9px] uppercase font-bold tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Volume2 className={`w-3.5 h-3.5 ${speaking ? 'animate-bounce text-emerald-400' : ''}`} />
              {speaking ? 'SYNTHESIZING...' : 'TRIGGER VOICE OUT'}
            </button>
            
            <AnimatePresence>
              {statusText && (
                <motion.span 
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> {statusText}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Accessibility Status Vectors */}
        <div className="border border-white/5 glass-card p-2.5 rounded-xl flex items-center justify-between text-[9px] tracking-wider font-bold">
          <span className="flex items-center gap-2 text-neutral-500 uppercase">
            <Accessibility className="w-3.5 h-3.5 text-cyan-500" /> ACCESSIBLE CORRIDORS:
          </span>
          <span className="font-bold text-emerald-400">98.2% INTEGRITY</span>
        </div>
      </div>
    </div>
  );
}
