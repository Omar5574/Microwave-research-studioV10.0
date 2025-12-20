// ============================================================================
// src/App.jsx - Final Integrated Version (UI + AI + Simulation)
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react';



// Data & Components
import { devices } from './data/devices'; // تأكد أن هذا الملف موجود وبه البيانات
import { Sidebar } from './components/layout/Sidebar';
import { ControlPanel } from './components/layout/ControlPanel';
import { PhysicsCanvas } from './components/simulation/PhysicsCanvas';
import { WaveformDisplay } from './components/simulation/WaveformDisplay';
import { FFTDisplay } from './components/simulation/FFTDisplay';
import { DeepExplanation } from './components/panels/DeepExplanation';
import ExpertQuery from './components/features/ExpertQuery';

export default function App() {
  // ========== UI STATES (New Header & Panel) ==========
  const [showExplanations, setShowExplanations] = useState(false);

  // ========== SIMULATION CORE STATES ==========
  const [activeId, setActiveId] = useState('klystron2');
  const [activeTab, setActiveTab] = useState('simulation');
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

  // ========== KEY MANAGEMENT (The Logic) ==========
  const [userApiKey, setUserApiKey] = useState(() => {
    return localStorage.getItem('USER_GEMINI_KEY') || "";
  });

  // ========== HELPERS & DERIVED STATE ==========
  const activeDevice = useMemo(() => devices.find(d => d.id === activeId), [activeId]);

  // توليد قائمة الشرح تلقائياً من بيانات الأجهزة الموجودة
  const deviceExplanations = useMemo(() => {
    const explanations = {};
    devices.forEach(d => {
      explanations[d.name] = d.desc;
    });
    return explanations;
  }, []);

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
  // Reset inputs when device changes
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
    const needsMathJax = mathMode === 'latex' || activeTab === 'explanation' || showChat;
    if (needsMathJax && !window.MathJax) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    }
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => { try { window.MathJax.typesetPromise(); } catch (e) {} }, 100);
    }
  }, [mathMode, activeDevice, inputs, activeTab, showChat]);

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
      const input = window.prompt(
        "💡 ميزة الذكاء الاصطناعي تتطلب مفتاح Gemini API.\n\n" +
        "يرجى إدخال المفتاح الخاص بك (مجاني من Google AI Studio)."
      );
      if (!input) return;
      finalKey = input.trim();
      localStorage.setItem('USER_GEMINI_KEY', finalKey);
      setUserApiKey(finalKey);
    }

    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setChatLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(finalKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Context: Microwave Engineering Student Project.
        Device: ${activeDevice.name}.
        Parameters: ${currentInputsFormatted}.
        Question: ${query}
        Answer in Arabic. Be concise. Use LaTeX for math ($...$).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setChatHistory(prev => [...prev, { role: 'model', text: text }]);
    } catch (error) {
      console.error("AI Error:", error);
      let msg = "حدث خطأ في الاتصال.";
      if (error.message.includes("403") || error.message.includes("key")) {
        msg = "المفتاح غير صحيح. حاول مرة أخرى.";
        localStorage.removeItem('USER_GEMINI_KEY');
        setUserApiKey("");
      }
      setChatHistory(prev => [...prev, { role: 'model', text: msg }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!activeDevice) return <div className="text-white flex h-screen items-center justify-center">Loading...</div>;

  // ==========================================================================
  // MAIN RENDER (Using your Custom Layout)
  // ==========================================================================
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] overflow-hidden font-sans">
      
      {/* 1. AI Chat Overlay (Always available) */}
      <ExpertQuery 
        show={showChat} onClose={() => setShowChat(false)}
        onQuery={handleGeminiQuery} loading={chatLoading}
        deviceName={activeDevice.name} history={chatHistory} currentInputs={currentInputsFormatted}
      />

      {/* 2. THE HEADER (Your Custom Design) */}
      <header className="h-16 bg-slate-900/95 border-b border-slate-700 flex items-center justify-between px-6 z-50 shadow-md shrink-0 backdrop-blur-md">
        
        {/* Left Side: Title + Toggle Button */}
        <div className="flex items-center gap-6">
          <h1 className="text-emerald-500 font-bold text-lg tracking-wider">
            Microwave Research Studio
          </h1>
          
          <button 
            onClick={() => setShowExplanations(!showExplanations)} 
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all duration-200 border
              ${showExplanations 
                ? "bg-emerald-500 border-emerald-400 text-black hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500"}`}
          > 
            {showExplanations ? "Hide Explanations" : "Show Device Explanations"}
          </button>

          {/* زر الشات أضفته هنا في الهيدر أيضاً لسهولة الوصول */}
          <button 
            onClick={() => setShowChat(true)}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Ask AI 🤖
          </button>
        </div>

        {/* Right Side: University Logo */}
        <div className="flex items-center opacity-90 hover:opacity-100 transition-opacity">
          {/* تأكد من وضع صورة اللوجو في مجلد public باسم kfs-logo.png */}
          <img 
            src="/kfs-logo.png" 
            alt="Kafr El Sheikh University"
            className="h-12 w-auto drop-shadow-md"
            onError={(e) => {e.target.style.display='none'}} // إخفاء الصورة لو مش موجودة
          />
        </div>
      </header>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 relative w-full h-full flex overflow-hidden">
        
        {/* Layer 0: التطبيق الفعلي (Sidebar + Canvas + Controls) */}
        {/* هنا نضع مكونات المحاكاة بدلاً من MicrowaveResearchStudioV9 */}
        <div className="flex flex-1 w-full h-full">
            
            {/* Sidebar */}
            <Sidebar devices={devices} activeId={activeId} setActiveId={setActiveId} />

            {/* Main Content (Canvas & Panels) */}
            <main className="flex-1 flex flex-col relative bg-black overflow-hidden">
                <div className="flex-1 relative overflow-hidden bg-[#050505]">
                    {activeTab === 'simulation' ? (
                        <>
                            <PhysicsCanvas deviceId={activeId} running={running} inputs={safeInputs} fidelity={fidelity} timeScale={timeScale} particleDensity={particleDensity} />
                            
                            {/* Info Overlay inside Canvas */}
                            <div className="absolute top-4 left-4 max-w-md pointer-events-none z-10">
                                <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">
                                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">{activeDevice.name}</h2>
                                    <p className="text-sm text-slate-300 leading-relaxed">{activeDevice.desc}</p>
                                </div>
                            </div>

                            {/* Graphs */}
                            {(showWaveform || showFFT) && (
                                <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none z-10 flex-col sm:flex-row">
                                    {showWaveform && <WaveformDisplay deviceId={activeId} inputs={safeInputs} running={running} timeScale={timeScale} />}
                                    {showFFT && <FFTDisplay deviceId={activeId} inputs={safeInputs} />}
                                </div>
                            )}
                        </>
                    ) : (
                        <DeepExplanation device={activeDevice} />
                    )}
                </div>

                {/* Bottom Control Panel */}
                <ControlPanel 
                    device={activeDevice} inputs={inputs} setInputs={setInputs} safeInputs={safeInputs}
                    mathMode={mathMode} setMathMode={setMathMode} showWaveform={showWaveform} setShowWaveform={setShowWaveform} showFFT={showFFT} setShowFFT={setShowFFT}
                />
            </main>
        </div>

        {/* Layer 50: قائمة الشرح المنبثقة (The Overlay) */}
        {showExplanations && (
          <div 
            className="absolute top-4 left-4 z-50 w-[350px] max-h-[calc(100vh-4rem)] 
                       p-4 rounded-lg border border-slate-600/50 shadow-2xl
                       bg-slate-900/95 backdrop-blur-xl text-slate-200 overflow-y-auto custom-scrollbar
                       animate-in fade-in slide-in-from-left-4 duration-300"
          > 
            <h3 className="text-emerald-400 font-bold text-sm mb-3 border-b border-slate-700 pb-2">
              Device Explanations
            </h3>

            <div className="space-y-3">
              {Object.entries(deviceExplanations).map(([k,v]) => ( 
                <div key={k} className="group hover:bg-white/5 p-2 rounded transition-colors cursor-pointer" onClick={() => {
                    // (اختياري) عند الضغط على اسم الجهاز ينقلك إليه
                    const dev = devices.find(d => d.name === k);
                    if(dev) setActiveId(dev.id);
                }}> 
                  <strong className="text-yellow-400 block mb-1 text-sm font-semibold">
                    {k}
                  </strong> 
                  <p className="text-slate-300 text-xs leading-relaxed opacity-90">
                    {v}
                  </p> 
                </div> 
              ))} 
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
