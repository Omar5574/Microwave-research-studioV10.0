import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { devices } from './data/devices';
import { Sidebar } from './components/layout/Sidebar';
import { ControlPanel } from './components/layout/ControlPanel';
import { PhysicsCanvas } from './components/simulation/PhysicsCanvas';
import { WaveformDisplay } from './components/simulation/WaveformDisplay';
import { FFTDisplay } from './components/simulation/FFTDisplay';
import { DeepExplanation } from './components/panels/DeepExplanation';
import ExpertQuery from './components/features/ExpertQuery';
import { Header } from './components/layout/Header'; // تأكد من وجود هذا الملف

export default function App() {
  // === STATE MANAGEMENT ===
  const [activeTab, setActiveTab] = useState("simulation"); 
  const [showQuickInfo, setShowQuickInfo] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // حالة القائمة للموبايل

  const [activeId, setActiveId] = useState('klystron2');
  const [running, setRunning] = useState(true);
  const [inputs, setInputs] = useState({});
  const [fidelity, setFidelity] = useState('medium');
  const [timeScale, setTimeScale] = useState(1.0);
  const [mathMode, setMathMode] = useState('plain');
  const [showWaveform, setShowWaveform] = useState(true);
  const [showFFT, setShowFFT] = useState(true);

  // AI Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('USER_GEMINI_KEY') || "");

  // Helpers
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
      const value = (inputs[p.id] !== undefined ? inputs[p.id] : p.def).toFixed(2);
      return `${p.label}: ${value} ${p.unit}`;
    }).join(', ');
  }, [activeDevice, inputs]);

  const particleDensity = useMemo(() => fidelity === 'high' ? 12.0 : fidelity === 'medium' ? 6.0 : 2.0, [fidelity]);

  // Effects
  useEffect(() => {
    if (!activeDevice) return;
    const defaults = {};
    activeDevice.params.forEach(p => defaults[p.id] = p.def);
    setInputs(defaults);
    setRunning(true);
    setChatHistory([]);
  }, [activeDevice]);

  // AI Handler
  const handleGeminiQuery = async (query) => {
    if (chatLoading || !query.trim()) return;
    let finalKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!finalKey) {
      const input = window.prompt("Enter Gemini API Key:");
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
      const prompt = `Device: ${activeDevice.name}\nParams: ${currentInputsFormatted}\nQuestion: ${query}\nAnswer in Arabic, technical & clear.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setChatHistory(prev => [...prev, { role: 'model', text: text }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Error: " + error.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!activeDevice) return <div className="text-white flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] overflow-hidden font-sans">
      
      <ExpertQuery 
        show={showChat} onClose={() => setShowChat(false)}
        onQuery={handleGeminiQuery} loading={chatLoading}
        deviceName={activeDevice.name} history={chatHistory} 
      />

      <Header 
        activeTab={activeTab} setActiveTab={setActiveTab}
        fidelity={fidelity} setFidelity={setFidelity}
        timeScale={timeScale} setTimeScale={setTimeScale}
        running={running} setRunning={setRunning}
        onChatOpen={() => setShowChat(true)}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Layout: Column on Mobile, Row on Desktop */}
      <div className="flex flex-1 relative overflow-hidden flex-col md:flex-row">
        
        {/* Sidebar Drawer Logic */}
        <div className={`
            absolute md:relative z-30 h-full transition-transform duration-300
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar devices={devices} activeId={activeId} setActiveId={(id) => {
            setActiveId(id);
            setIsSidebarOpen(false);
          }} />
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col relative bg-black overflow-hidden w-full">
          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            
            {showQuickInfo && (
              <div className="absolute top-4 left-4 z-40 w-80 bg-slate-900/95 p-4 rounded shadow-2xl border border-slate-600">
                 <h3 className="text-emerald-400 font-bold mb-2">{activeDevice.name}</h3>
                 <p className="text-slate-300 text-sm mb-3">{activeDevice.desc}</p>
                 <button onClick={()=>setShowQuickInfo(false)} className="text-xs text-red-400 underline">Close</button>
              </div>
            )}

            {activeTab === "simulation" ? (
              <>
                <PhysicsCanvas 
                  deviceId={activeId} running={running} inputs={safeInputs}
                  fidelity={fidelity} timeScale={timeScale} particleDensity={particleDensity}
                />
                
                {/* Hide Graphs on Mobile */}
                <div className="hidden md:flex absolute bottom-6 right-6 flex-row gap-4 items-end pointer-events-none z-10 scale-90 md:scale-110 origin-bottom-right">
                  <div className="pointer-events-auto">
                    {showWaveform && <WaveformDisplay deviceId={activeId} inputs={safeInputs} running={running} />}
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
                device={activeDevice} inputs={inputs} setInputs={setInputs}
                safeInputs={safeInputs} mathMode={mathMode} setMathMode={setMathMode}
                showWaveform={showWaveform} setShowWaveform={setShowWaveform}
                showFFT={showFFT} setShowFFT={setShowFFT}
            />
          )}
        </main>
      </div>
    </div>
  );
}
