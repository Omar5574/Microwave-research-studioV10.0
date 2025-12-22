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
import { Header } from './components/layout/Header';

export default function App() {
  // === TABS & UI STATE ===
  const [activeTab, setActiveTab] = useState("simulation"); 
  const [showQuickInfo, setShowQuickInfo] = useState(false);
  
  // *** NEW: Mobile Sidebar State ***
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      {/* HEADER: Added onMenuToggle prop */}
      <Header 
        activeTab={activeTab} setActiveTab={setActiveTab}
        fidelity={fidelity} setFidelity={setFidelity}
        timeScale={timeScale} setTimeScale={setTimeScale}
        running={running} setRunning={setRunning}
        onChatOpen={() => setShowChat(true)}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* BODY: Changed to flex-col for mobile, flex-row for desktop */}
      <div className="flex flex-1 relative overflow-hidden flex-col md:flex-row">
        
        {/* SIDEBAR: Responsive logic added (Drawer style on mobile) */}
        <div className={`
            absolute md:relative z-30 h-full transition-transform duration-300
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar devices={devices} activeId={activeId} setActiveId={(id) => {
            setActiveId(id);
            setIsSidebarOpen(false); // Close menu on selection
          }} />
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 flex flex-col relative bg-black overflow-hidden w-full">

          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            
            {/* Quick Info Popup */}
            {showQuickInfo && (
              <div className="absolute top-4 left-4 z-40 w-80 bg-slate-900/95 backdrop-blur border border-slate-600 p-4 rounded shadow-2xl animate-in fade-in slide-in-from-left-4">
                 <h3 className="text-emerald-400 font-bold mb-2">{activeDevice.name}</h3>
                 <p className="text-slate-300 text-sm leading-relaxed mb-3">{activeDevice.desc}</p>
                 <div className="text-xs text-slate-400 bg-black/40 p-2 rounded border border-slate-700 font-mono">
                    {activeDevice.theory.plain}
                 </div>
                 <button onClick={()=>setShowQuickInfo(false)} className="mt-2 text-xs text-red-400 underline">Close</button>
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
                
                {/* 2. Overlays (Waveform & FFT) - Hidden on small mobile screens to save space */}
                <div className="hidden md:flex absolute bottom-6 right-6 flex-row gap-4 items-end pointer-events-none z-10 scale-90 md:scale-125 origin-bottom-right">
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
