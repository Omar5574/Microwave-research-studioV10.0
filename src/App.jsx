// ============================================================================
// src/App.jsx - Main State Container
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react';

// Data imports
import { devices } from './data/devices';

// Layout components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ControlPanel } from './components/layout/ControlPanel';

// Simulation components
import { PhysicsCanvas } from './components/simulation/PhysicsCanvas';
import { WaveformDisplay } from './components/simulation/WaveformDisplay';
import { FFTDisplay } from './components/simulation/FFTDisplay';

// Panel components
import { DeepExplanation } from './components/panels/DeepExplanation';

// Feature components
import { ExpertQuery } from './components/features/ExpertQuery';

export default function App() {
  // ========== CORE STATE ==========
  const [activeId, setActiveId] = useState('klystron2');
  const [activeTab, setActiveTab] = useState('simulation'); // 'simulation' | 'explanation'
  const [running, setRunning] = useState(true);
  const [inputs, setInputs] = useState({});
  
  // ========== DISPLAY OPTIONS ==========
  const [fidelity, setFidelity] = useState('medium'); // 'low' | 'medium' | 'high'
  const [timeScale, setTimeScale] = useState(1.0);
  const [mathMode, setMathMode] = useState('plain'); // 'plain' | 'latex'
  const [showWaveform, setShowWaveform] = useState(true);
  const [showFFT, setShowFFT] = useState(true);
  
  // ========== CHAT/AI STATE ==========
  const [showChat, setShowChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // ========== DERIVED STATE ==========
  const activeDevice = useMemo(() => 
    devices.find(d => d.id === activeId), 
    [activeId]
  );

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

  const particleDensity = useMemo(() => {
    return fidelity === 'high' ? 12.0 : fidelity === 'medium' ? 6.0 : 2.0;
  }, [fidelity]);

  // ========== EFFECTS ==========
  
  // Initialize inputs when device changes
  useEffect(() => {
    if (!activeDevice) return;
    const defaults = {};
    activeDevice.params.forEach(p => defaults[p.id] = p.def);
    setInputs(defaults);
    setRunning(true);
    setChatHistory([]); // Reset chat history on device change
  }, [activeDevice]);

  // Load MathJax for LaTeX rendering
  useEffect(() => {
    const needsMathJax = mathMode === 'latex' || activeTab === 'explanation' || showChat;
    
    if (needsMathJax && !window.MathJax) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    }
    
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => {
        try {
          window.MathJax.typesetPromise();
        } catch (e) {
          console.warn("MathJax typeset error:", e);
        }
      }, 100);
    }
  }, [mathMode, activeDevice, inputs, activeTab, showChat]);

  // ========== HANDLERS ==========
  
  const handleGeminiQuery = async (query) => {
    if (chatLoading || !query.trim()) return;
    setChatLoading(true);

    const currentDeviceName = activeDevice.name;
    const systemPrompt = `You are µW-Expert, a world-class Microwave Engineering Research Assistant. 
Active device: ${currentDeviceName} (${activeDevice.type}). 
Current parameters: ${currentInputsFormatted}. 
Use LaTeX for all math ($...$ for inline, $$...$$ for display). 
Respond in Arabic only.`;
    
    // Add user query to history
    const newUserEntry = { role: 'user', text: query };
    setChatHistory(prev => [...prev, newUserEntry]);

    // ===== GEMINI API INTEGRATION =====
    // Replace this with your actual Gemini API call
    const apiKey = "YOUR_GEMINI_API_KEY_HERE"; // ⚠️ Replace with your key
    
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      const errorResponse = "عذراً، لم يتم ضبط مفتاح Gemini API. الرجاء إضافة المفتاح في الكود.";
      setChatHistory(prev => [...prev, { role: 'model', text: errorResponse }]);
      setChatLoading(false);
      return;
    }

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ role: "user", parts: [{ text: query }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                          "عذراً، لم أتمكن من الحصول على إجابة.";
      
      setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: `خطأ في الاتصال: ${error.message}` 
      }]);
    }

    setChatLoading(false);
  };

  // ========== RENDER ==========
  
  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505] text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Microwave Research Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-200 font-sans overflow-hidden">
      
      {/* AI Expert Chat Modal */}
      <ExpertQuery 
        show={showChat}
        onClose={() => setShowChat(false)}
        onQuery={handleGeminiQuery}
        loading={chatLoading}
        deviceName={activeDevice.name}
        history={chatHistory}
        currentInputs={currentInputsFormatted}
      />

      {/* Header */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fidelity={fidelity}
        setFidelity={setFidelity}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        running={running}
        setRunning={setRunning}
        onChatOpen={() => setShowChat(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar 
          devices={devices}
          activeId={activeId}
          setActiveId={setActiveId}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative bg-black overflow-hidden">
          
          {/* Viewport */}
          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            
            {activeTab === 'simulation' ? (
              <>
                {/* Physics Canvas */}
                <PhysicsCanvas 
                  deviceId={activeId}
                  running={running}
                  inputs={safeInputs}
                  fidelity={fidelity}
                  timeScale={timeScale}
                  particleDensity={particleDensity}
                />
                
                {/* Device Info Overlay */}
                <div className="absolute top-4 left-4 max-w-md pointer-events-none z-10">
                  <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      {activeDevice.name}
                      <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                        {activeDevice.type}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {activeDevice.desc}
                    </p>
                  </div>
                </div>

                {/* Waveform & FFT Displays */}
                {(showWaveform || showFFT) && (
                  <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none z-10 flex-col sm:flex-row">
                    {showWaveform && (
                      <WaveformDisplay 
                        deviceId={activeId}
                        inputs={safeInputs}
                        running={running}
                        timeScale={timeScale}
                      />
                    )}
                    {showFFT && (
                      <FFTDisplay 
                        deviceId={activeId}
                        inputs={safeInputs}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Deep Explanation View */
              <DeepExplanation device={activeDevice} />
            )}
          </div>

          {/* Control Panel */}
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
          />
        </main>
      </div>

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { 
          width: 6px; 
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: #0a0a0a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #334155; 
          border-radius: 3px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: #475569; 
        }
      `}</style>
    </div>
  );
}