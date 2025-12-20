// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';


// Data & Components imports
import { devices } from './data/devices';
import { Sidebar } from './components/layout/Sidebar';
import { ControlPanel } from './components/layout/ControlPanel';
import { PhysicsCanvas } from './components/simulation/PhysicsCanvas';
import { WaveformDisplay } from './components/simulation/WaveformDisplay';
import { FFTDisplay } from './components/simulation/FFTDisplay';
import { DeepExplanation } from './components/panels/DeepExplanation';
import ExpertQuery from './components/features/ExpertQuery';

export default function App() {
  // === RESPONSIVE STATE ===
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // للموبايل

  // === TABS & UI STATE ===
  const [activeTab, setActiveTab] = useState("simulation"); 
  const [showQuickInfo, setShowQuickInfo] = useState(false); 

  // ========== SIMULATION CORE STATES ==========
  const [activeId, setActiveId] = useState('klystron2');
  const [running, setRunning] = useState(true);
  const [inputs, setInputs] = useState({});
  const [fidelity, setFidelity] = useState('medium');
  const [timeScale, setTimeScale] = useState(1.0);
  const [mathMode, setMathMode] = useState('plain');
  const [showWaveform, setShowWaveform] = useState(true);
  const [showFFT, setShowFFT] = useState(true);

  // ========== AI CHAT STATES ==========
  const [showChat, setShowChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // ========== KEY MANAGEMENT ==========
  const [userApiKey, setUserApiKey] = useState(() => {
    return localStorage.getItem('USER_GEMINI_KEY') || "";
  });

  // ========== HELPERS & DERIVED STATE ==========
  const activeDevice = useMemo(() => devices.find(d => d.id === activeId), [activeId]);

  const safeInputs = useMemo(() => {
    if (!activeDevice) return {};
    const defaults = {};
    activeDevice.params.forEach(p => defaults[p.id] = p.def);
    return { ...defaults, ...inputs };
  }, [activeDevice, inputs]);

  const currentInputsFormatted = useMemo(() => {
    if (!activeDevice) return "N/A";
    return activeDevice.params.map(p => {
      const value = (inputs[p.id] !== undefined ? inputs[p.id] : p.def)
        .toFixed(p.step >= 1 ? 0 : (p.step >= 0.1 ? 1 : 2));
      return `${p.label}: ${value} ${p.unit}`;
    }).join(', ');
  }, [activeDevice, inputs]);

  const particleDensity = useMemo(() => fidelity === 'high' ? 12.0 : fidelity === 'medium' ? 6.0 : 2.0, [fidelity]);

  // ========== EFFECTS ==========
  
  // إغلاق القائمة تلقائياً عند اختيار جهاز (على الموبايل)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    if (!activeDevice) return;
    const defaults = {};
    activeDevice.params.forEach(p => defaults[p.id] = p.def);
    setInputs(defaults);
    setRunning(true);
    setChatHistory([]);
  }, [activeDevice]);

  // MathJax Loader
  useEffect(() => {
    const needsMathJax = mathMode === 'latex' || activeTab === 'explanation' || showChat || showQuickInfo;
    if (needsMathJax && !window.MathJax) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    }
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => { try { window.MathJax.typesetPromise(); } catch (e) {} }, 100);
    }
  }, [mathMode, activeDevice, inputs, activeTab, showChat, showQuickInfo]);

  // ========== AI HANDLER ==========
  const handleGeminiQuery = async (query) => {
    if (chatLoading || !query.trim()) return;

    let finalKey = userApiKey; 
    if (!finalKey) {
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey && envKey.startsWith("AIza")) {
        finalKey = envKey;
      }
    }

    if (!finalKey) {
      const input = window.prompt("AI feature needs Gemini key.\nEnter your API key.");
      if (!input) return;
      finalKey = input.trim();
      localStorage.setItem('USER_GEMINI_KEY', finalKey);
      setUserApiKey(finalKey);
    }

    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setChatLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(finalKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Device: ${activeDevice.name}
        Parameters: ${currentInputsFormatted}
        Question: ${query}
        Answer in Arabic with some LaTeX if needed. Keep it technical but clear for engineering students.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setChatHistory(prev => [...prev, { role: 'model', text: text }]);
    } catch (error) {
      console.error("AI Error:", error);
      let msg = "Error connecting to server.";
      if (error.message && (error.message.includes("403") || error.message.includes("key"))) {
        msg = "Invalid API key.";
        localStorage.removeItem('USER_GEMINI_KEY');
        setUserApiKey("");
      }
      setChatHistory(prev => [...prev, { role: 'model', text: msg }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!activeDevice) return <div className="text-white flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] overflow-hidden font-sans">

      {/* AI CHAT OVERLAY */}
      <ExpertQuery 
        show={showChat} onClose={() => setShowChat(false)}
        onQuery={handleGeminiQuery} loading={chatLoading}
        deviceName={activeDevice.name} history={chatHistory} currentInputs={currentInputsFormatted}
      />

      {/* HEADER */}
      <header className="h-16 bg-slate-900/95 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 z-50 shrink-0 relative">
        
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* MOBILE MENU BUTTON (Using standard text symbols instead of lucide-react) */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-slate-300 hover:text-emerald-400 p-1 text-2xl font-bold leading-none"
          >
            {isSidebarOpen ? "✕" : "☰"} 
          </button>

          <h1 className="text-emerald-500 font-bold text-sm md:text-lg tracking-wider truncate max-w-[120px] md:max-w-none">
            Micro Studio
          </h1>

          <div className="flex items-center gap-2 ml-2 md:ml-4">
            <button
              onClick={() => setActiveTab("simulation")}
              className={`px-2 md:px-4 py-1.5 text-[10px] md:text-sm font-bold rounded transition-all ${
                activeTab === "simulation"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              Sim
            </button>

            <button
              onClick={() => setActiveTab("explanation")}
              className={`px-2 md:px-4 py-1.5 text-[10px] md:text-sm font-bold rounded transition-all ${
                activeTab === "explanation"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              Theory
            </button>
            
             <button
              onClick={() => setShowQuickInfo(!showQuickInfo)}
              className={`hidden md:block ml-2 px-3 py-1.5 text-xs font-bold uppercase rounded border transition-all ${
                showQuickInfo 
                  ? "bg-emerald-500 border-emerald-400 text-black" 
                  : "bg-transparent border-slate-600 text-slate-400 hover:text-emerald-400 hover:border-emerald-500"
              }`}
            >
              {showQuickInfo ? "Hide" : "Info"}
            </button>

          </div>
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowChat(true)}
                className="px-2 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg flex items-center gap-1"
            >
                <span className="hidden md:inline">Ask AI</span> 
                <span className="text-base md:text-lg">🤖</span>
            </button>

            <img 
            src="/kfs-logo.png" 
            alt="Logo"
            className="h-8 md:h-12 opacity-90 hover:opacity-100 transition-opacity hidden sm:block"
            onError={(e) => {e.target.style.display='none'}}
            />
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* SIDEBAR WRAPPER (Responsive) */}
        <div className={`
            absolute inset-y-0 left-0 z-40 w-64 bg-[#0b0f19] transform transition-transform duration-300 ease-in-out border-r border-slate-700
            md:relative md:translate-x-0 
            ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
           <Sidebar devices={devices} activeId={activeId} setActiveId={setActiveId} />
        </div>

        {/* OVERLAY for Mobile (Closes sidebar when clicking outside) */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 z-30 bg-black/50 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        <main className="flex-1 flex flex-col relative bg-black overflow-hidden w-full">

          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            
            {/* Quick Info Popup (Responsive) */}
            {showQuickInfo && (
              <div className="absolute top-4 left-4 z-40 w-[90%] md:w-80 bg-slate-900/95 backdrop-blur border border-slate-600 p-4 rounded shadow-2xl animate-in fade-in slide-in-from-left-4">
                 <h3 className="text-emerald-400 font-bold mb-2">{activeDevice.name}</h3>
                 <p className="text-slate-300 text-sm leading-relaxed mb-3">{activeDevice.desc}</p>
                 <div className="text-xs text-slate-400 bg-black/40 p-2 rounded border border-slate-700 font-mono">
                    {activeDevice.theory.plain}
                 </div>
              </div>
            )}

            {activeTab === "simulation" ? (
              <>
                <PhysicsCanvas 
                  deviceId={activeId}
                  running={running}
                  inputs={safeInputs}
                  fidelity={fidelity}
                  timeScale={timeScale}
                  particleDensity={particleDensity}
                />
                
                {/* 2. Overlays - Responsive Positioning */}
                <div className="absolute bottom-20 md:bottom-6 right-2 md:right-6 flex flex-row gap-2 md:gap-4 items-end pointer-events-none z-10 scale-75 md:scale-125 origin-bottom-right">
                  <div className="pointer-events-auto">
                    {showWaveform && <WaveformDisplay deviceId={activeId} inputs={safeInputs} running={running} timeScale={timeScale} />}
                  </div>
                  <div className="pointer-events-auto hidden sm:block"> 
                     {/* FFT مخفي في الشاشات الصغيرة جداً لتوفير الأداء والمساحة */}
                    {showFFT && <FFTDisplay deviceId={activeId} inputs={safeInputs} />}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full overflow-y-auto bg-slate-900/50 p-4 md:p-6">
                 <DeepExplanation device={activeDevice} mathMode={mathMode} />
              </div>
            )}

          </div>

          {activeTab === "simulation" && (
             <div className="shrink-0 overflow-x-auto">
                {/* Control Panel Wrapper to handle mobile overflow */}
                <ControlPanel 
                    device={activeDevice}
                    inputs={inputs}
                    setInputs={setInputs}
                    safeInputs={safeInputs}
                    mathMode={mathMode}
                    setMathMode={setMathMode}
                    showWaveform={showWaveform}
                    setShowWaveform={setShowWaveform}
                    showFFT={showFFT}
                    setShowFFT={setShowFFT}
                    running={running}
                    setRunning={setRunning}
                    fidelity={fidelity}
                    setFidelity={setFidelity}
                    timeScale={timeScale}
                    setTimeScale={setTimeScale}
                />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
