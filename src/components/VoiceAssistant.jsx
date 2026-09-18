import React, { useState, useRef } from 'react';
import { Mic, Loader2, Bot, AlertCircle, CheckCircle2 } from 'lucide-react';
// NAYA: Farmer ka data nikalne ke liye useAuth ko import kiya hai
import { useAuth } from '../context/AuthContext';

const VoiceAssistant = () => {
  const [status, setStatus] = useState('idle'); // 'idle', 'recording', 'processing', 'success', 'error'
  const [aiText, setAiText] = useState("");
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  
  // NAYA: Current logged-in user ki details nikaalna
  const { user } = useAuth();

  // Recording Shuru Karna
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = sendAudioToBackend;
      
      mediaRecorder.current.start();
      setStatus('recording');
      setAiText("Sun raha hoon... Boliye 🎤");
    } catch (error) {
      console.error("Mic error:", error);
      setStatus('error');
      setAiText("Microphone ki permission dein.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // Recording Rokna
  const stopRecording = () => {
    if (mediaRecorder.current && status === 'recording') {
      mediaRecorder.current.stop();
      setStatus('processing');
      setAiText("Awaaz samajh raha hoon...");
    }
  };

  // Backend (Flask) ko Audio aur User Data Bhejna
  const sendAudioToBackend = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    audioChunks.current = []; 

    const formData = new FormData();
    formData.append("audio", audioBlob, "farmer_input.webm");
    
    // JADU YAHAN HAI: Hum kisan ka data JSON mein badal kar Flask ko bhej rahe hain
    // Agar user logged in nahi hai (jaise testing ke time), toh khali object '{}' jayega
    formData.append("user_data", JSON.stringify(user || {}));

    try {
      const response = await fetch("http://localhost:5001/assistant", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setAiText(data.reply_text); 
        
        if (data.audio_url) {
          // Unique timestamp takki browser hamesha nayi awaaz sunaye
          const audio = new Audio(`http://localhost:5001/${data.audio_url}?t=${new Date().getTime()}`);
          audio.play();
          
          audio.onended = () => {
            setTimeout(() => {
              setStatus('idle');
              setAiText("");
            }, 2000);
          };
        }
      } else {
        setStatus('error');
        setAiText(data.reply_text || "Kuch gadbad ho gayi.");
        setTimeout(() => { setStatus('idle'); setAiText(""); }, 4000);
      }
    } catch (error) {
      console.error("Backend error:", error);
      setStatus('error');
      setAiText("Server se connect nahi ho paya.");
      setTimeout(() => { setStatus('idle'); setAiText(""); }, 4000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {/* 💬 Chat Bubble / Tooltip */}
      {status !== 'idle' && (
        <div className="mb-4 relative max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-start gap-3">
            
            {/* Dynamic Icons */}
            <div className="mt-0.5">
              {status === 'recording' && <Mic className="w-5 h-5 text-rose-500 animate-pulse" />}
              {status === 'processing' && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
              {status === 'success' && <Bot className="w-5 h-5 text-emerald-600" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
            </div>

            <p className="text-sm font-semibold text-slate-700 leading-snug">
              {aiText}
            </p>
          </div>
          
          {/* Tooltip Tail */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-slate-100 transform rotate-45 shadow-[4px_4px_10px_rgb(0,0,0,0.05)]"></div>
        </div>
      )}

      {/* 🎤 Main Floating Action Button */}
      <button 
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording} 
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ease-out select-none outline-none ${
          status === 'recording' 
            ? 'bg-rose-500 scale-110 shadow-[0_0_30px_rgba(244,63,94,0.6)]' 
            : status === 'processing'
              ? 'bg-amber-500 cursor-wait shadow-lg'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 shadow-[0_8px_20px_rgba(5,150,105,0.4)] active:scale-95'
        }`}
      >
        {/* Pulse effect */}
        {status === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75 duration-1000"></span>
            <span className="absolute inset-[-10px] rounded-full border-2 border-rose-400 animate-pulse opacity-50"></span>
          </>
        )}

        {/* Icons */}
        {status === 'processing' ? (
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 className="w-7 h-7 text-white" />
        ) : (
          <Mic className={`w-7 h-7 text-white transition-transform ${status === 'recording' ? 'animate-bounce' : ''}`} />
        )}
      </button>
      
      {/* Helper text */}
      {status === 'idle' && (
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mr-2 opacity-70">
          Hold to Talk
        </span>
      )}
    </div>
  );
};

export default VoiceAssistant;