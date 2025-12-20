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
  // === TABS & UI STATE ===
  const [activeTab, setActiveTab] = useState("simulation"); // 'simulation' or 'explanation'
  const [showQuickInfo, setShowQuickInfo] = useState(false); // <--- RESTORED OLD FEATURE

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
  useEffect(() => {
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
    // ... (Your existing AI logic) ...
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
      <header className="h-16 bg-slate-900/95 border-b border-slate-700 flex items-center justify-between px-6 z-50 shrink-0">
        
        <div className="flex items-center gap-4">
          <h1 className="text-emerald-500 font-bold text-lg tracking-wider hidden md:block">
            Microwave Research Studio
          </h1>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setActiveTab("simulation")}
              className={`px-4 py-1.5 text-sm font-bold rounded transition-all ${
                activeTab === "simulation"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              Live Simulation
            </button>

            <button
              onClick={() => setActiveTab("explanation")}
              className={`px-4 py-1.5 text-sm font-bold rounded transition-all ${
                activeTab === "explanation"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              Deep Explanation
            </button>
            
            {/* RESTORED QUICK INFO BUTTON */}
             <button
              onClick={() => setShowQuickInfo(!showQuickInfo)}
              className={`ml-2 px-3 py-1.5 text-xs font-bold uppercase rounded border transition-all ${
                showQuickInfo 
                  ? "bg-emerald-500 border-emerald-400 text-black" 
                  : "bg-transparent border-slate-600 text-slate-400 hover:text-emerald-400 hover:border-emerald-500"
              }`}
            >
              {showQuickInfo ? "Hide Info" : "Quick Info"}
            </button>

          </div>

          <button 
            onClick={() => setShowChat(true)}
            className="px-4 py-1.5 text-xs font-bold rounded bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg ml-4 flex items-center gap-2"
          >
            <span>Ask AI</span> 
            <span className="text-lg">🤖</span>
          </button>
        </div>

        <div className="flex items-center">
            <img 
            src="/kfs-logo.png" 
            alt="University Logo"
            className="h-12 opacity-90 hover:opacity-100 transition-opacity"
            onError={(e) => {e.target.style.display='none'}}
            />
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 relative overflow-hidden">
        
        <Sidebar devices={devices} activeId={activeId} setActiveId={setActiveId} />

        <main className="flex-1 flex flex-col relative bg-black overflow-hidden">

          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            
            {/* RESTORED QUICK INFO POPUP (LAYERED ON TOP) */}
            {showQuickInfo && (
              <div className="absolute top-4 left-4 z-40 w-80 bg-slate-900/95 backdrop-blur border border-slate-600 p-4 rounded shadow-2xl animate-in fade-in slide-in-from-left-4">
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
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-none z-10">
                  <div className="pointer-events-auto">
                    {showWaveform && <WaveformDisplay deviceId={activeId} inputs={safeInputs} running={running} timeScale={timeScale} />}
                  </div>
                  <div className="pointer-events-auto">
                    {showFFT && <FFTDisplay deviceId={activeId} inputs={safeInputs} />}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full overflow-y-auto bg-slate-900/50 p-6">
                 <DeepExplanation device={activeDevice} mathMode={mathMode} />
              </div>
            )}

          </div>

          {activeTab === "simulation" && (
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
          )}

        </main>
      </div>
    </div>
  );
}
