import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Send } from 'lucide-react';

export default function VoiceSlotAssistant({ onAutoFill, centers = [] }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

const parseVoiceIntent = (text) => {
    const lower = text.toLowerCase().trim();
    const result = {};

    console.log("🎤 Captured Speech:", lower);

    // 1. Crop Detection (English + Hindi Support)
    if (lower.includes('gehu') || lower.includes('wheat') || lower.includes('गेहूं') || lower.includes('गेहु')) {
      result.cropType = 'Wheat (Gehu)';
    } else if (lower.includes('dhan') || lower.includes('paddy') || lower.includes('chawal') || lower.includes('धान') || lower.includes('चावल')) {
      result.cropType = 'Paddy (Dhan)';
    } else if (lower.includes('sarson') || lower.includes('mustard') || lower.includes('सरसों')) {
      result.cropType = 'Mustard (Sarson)';
    }

    // 2. Mandi / Center Detection (English + Hindi Mandi names support)
    const matchedCenter = centers.find(c => {
      const cName = c.name?.toLowerCase() || '';
      const cDist = c.district?.toLowerCase() || '';
      // Agar Hindi text mein English name ya district match ho jaye
      return lower.includes(cName) || lower.includes(cDist);
    });

    if (matchedCenter) {
      result.center = matchedCenter;
    }

    // 3. Date Detection (English + Hindi words like 'kal')
    const today = new Date();
    if (lower.includes('kal') || lower.includes('tomorrow') || lower.includes('कल')) {
      today.setDate(today.getDate() + 1);
      result.date = today.toISOString().split('T')[0];
    } else if (lower.includes('parso') || lower.includes('परसों')) {
      today.setDate(today.getDate() + 2);
      result.date = today.toISOString().split('T')[0];
    } else {
      result.date = today.toISOString().split('T')[0];
    }

    console.log("🚀 Mapped Intent Result:", result);
    onAutoFill(result);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowManualInput(true);
      alert('Aapka browser voice recognition support nahi karta. Niche text box me type karein.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hindi-India speech recognition model
      recognition.interimResults = false;

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        parseVoiceIntent(text);
      };
      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setListening(false);
      };
      recognition.onend = () => setListening(false);

      recognition.start();
    } catch (e) {
      console.error("Speech initialization error:", e);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscript(manualText);
    parseVoiceIntent(manualText);
    setManualText('');
  };

  return (
    <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md mb-4 border border-emerald-500/30 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={startListening}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              listening ? 'bg-rose-500 animate-pulse text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
            }`}
            title="Mic dabakar bolein"
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div>
            <div className="text-xs font-black flex items-center gap-1.5 text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kisan Voice Assistant</span>
            </div>
            <p className="text-[10px] text-slate-300 truncate max-w-[220px] sm:max-w-md">
              {transcript ? `Processed: "${transcript}"` : 'Jaise: "Kal Jehanabad mandi mein gehu bechna hai"'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          {showManualInput ? 'Band Karein' : '⌨️ Type karke test karein'}
        </button>
      </div>

      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1 animate-fadeIn">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Type: 'Jehanabad mandi me gehu'"
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        </form>
      )}
    </div>
  );
}