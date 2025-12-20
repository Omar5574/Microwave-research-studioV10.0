import React from "react";
import PhysicsCanvas from "./simulation/PhysicsCanvas";
import WaveformDisplay from "./simulation/WaveformDisplay";
import FFTDisplay from "./simulation/FFTDisplay";
import ExpertQuery from "./features/ExpertQuery";
import { devices } from "../data/devices";

export default function MicrowaveResearchStudio({
  activeTab,
  setActiveTab,
  activeId,
  setActiveId,
  safeInputs,
  timeScale,
  particleDensity,
  fidelity,
  setFidelity,
  running,
  setRunning,
  showChat,
  setShowChat,
  handleGeminiQuery,
  chatLoading,
  chatHistory,
  currentInputsFormatted,
  inputs,
  setInputs,
  mathMode,
  setMathMode,
  showWaveform,
  setShowWaveform,
  showFFT,
  setShowFFT,
}) {

  const activeDevice = devices.find(d => d.id === activeId);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-200 font-sans overflow-hidden">
      
      {/* RENDER CHAT MODAL */}
      <ExpertQuery 
        show={showChat}
        onClose={() => setShowChat(false)}
        onQuery={handleGeminiQuery}
        loading={chatLoading}
        deviceName={activeDevice.name}
        history={chatHistory}
        currentInputs={currentInputsFormatted}
      />

      {/* ================= HEADER ================= */}
      <header className="h-16 border-b border-slate-800 bg-gradient-to-r from-[#0a0a0f] to-[#0f1115] flex items-center justify-between px-6 z-20 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl text-xl">µW</div>
          <div>
            <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Microwave Research Studio
            </h1>
            <div className="text-[10px] text-slate-500 font-mono">V9.4 UNIFIED PHYSICS ENGINE</div>
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* View Tabs */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 mr-4">
            <button 
                onClick={() => setActiveTab('simulation')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'simulation' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                Live Simulation
            </button>
            <button 
                onClick={() => setActiveTab('explanation')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'explanation' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                Deep Explanation
            </button>
          </div>

          {/* Fidelity */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Fidelity</span>
            <select 
              value={fidelity} 
              onChange={(e) => setFidelity(e.target.value)}
              className="bg-transparent text-xs text-blue-400 font-mono outline-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Time Scale */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Time</span>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1" 
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              className="w-20 h-1 accent-blue-500"
            />
            <span className="text-xs text-blue-400 font-mono w-8">{timeScale.toFixed(1)}×</span>
          </div>

          {/* Chat button */}
          <button 
            onClick={() => setShowChat(true)} 
            className="px-4 py-2 rounded-lg font-bold transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 text-sm"
          >
            Ask µW-Expert
          </button>

          {/* Status */}
          <div className={`px-4 py-2 rounded-lg border transition-all ${running ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-yellow-500/30 bg-yellow-900/20 text-yellow-400'}`}>
            <div className="text-[10px] font-bold">{running ? "● LIVE" : "❚❚ PAUSED"}</div>
          </div>

          {/* Run/Pause */}
          <button 
            onClick={() => setRunning(!running)} 
            className={`px-5 py-2 rounded-lg font-bold transition-all shadow-lg text-sm ${running ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ========== SIDE: DEVICE LIST ========== */}
        <aside className="w-72 bg-[#0a0a0a] border-r border-slate-800 flex flex-col z-10 shadow-2xl shrink-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800 shrink-0">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Device Library</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
            {['O-TYPE', 'CROSSED-FIELD (M-TYPE)', 'SOLID-STATE', 'QUANTUM EFFECT', 'AVALANCHE TRANSIT'].map(cat => {
              const categoryDevices = devices.filter(d => d.type === cat);
              if (categoryDevices.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-2 py-1 text-[10px] text-blue-400 font-bold mb-1 uppercase tracking-wider bg-blue-900/10 rounded">
                    {cat}
                  </div>
                  {categoryDevices.map(d => (
                    <button 
                      key={d.id} 
                      onClick={() => setActiveId(d.id)} 
                      className={`w-full text-left px-4 py-3 rounded-lg text-xs mb-1 transition-all ${
                        activeId === d.id 
                          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-l-4 border-blue-500 text-white shadow-lg' 
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">{d.name}</div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ========== MAIN VIEWPORT ========== */}
        <main className="flex-1 flex flex-col relative bg-black overflow-hidden">
            
            {/* Display Content */}
            <div className="flex-1 relative overflow-hidden bg-[#050505]">
            {activeTab === 'simulation' ? (
                <>
                {/* Canvas */}
                <PhysicsCanvas 
                    deviceId={activeId} 
                    running={running} 
                    inputs={safeInputs} 
                    fidelity={fidelity}
                    timeScale={timeScale}
                    particleDensity={particleDensity}
                />
                
                {/* Device Description Overlay */}
                <div className="absolute top-4 left-4 max-w-md pointer-events-none z-10">
                    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        {activeDevice.name}
                        <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                        {activeDevice.type}
                        </span>
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">{activeDevice.desc}</p>
                    </div>
                </div>

                {/* Waveform + FFT Visuals */}
                {(showWaveform || showFFT) && (
                    <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none z-10 flex-col sm:flex-row">
                    {showWaveform && (
                        <WaveformDisplay deviceId={activeId} inputs={safeInputs} running={running} timeScale={timeScale} />
                    )}
                    {showFFT && (
                        <FFTDisplay deviceId={activeId} inputs={safeInputs} />
                    )}
                    </div>
                )}
                </>
            ) : (

                /* Deep Explanation Tab */
                <div className="h-full overflow-y-auto custom-scrollbar p-12 max-w-5xl mx-auto">
                  <h2 className="text-4xl font-bold text-white mb-2">
                    {activeDevice.name}
                  </h2>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    {activeDevice.desc}
                  </p>
                </div>
            )}
            </div>

          {/* Bottom Control Area */}
          <div className="h-80 bg-[#0f1115] border-t border-slate-800 flex z-20 shrink-0">
            <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 overflow-y-auto custom-scrollbar">
              {activeDevice.params.map(p => (
                <div key={p.id} className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-blue-300">{p.label}</label>
                    <span className="text-xs font-mono bg-black/50 px-3 py-0.5 rounded text-emerald-400 border border-emerald-900/30">
                      {safeInputs[p.id]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-96 bg-[#0a0a0a] border-l border-slate-800 flex flex-col shrink-0"/>
          </div>
        </main>
      </div>
    </div>
  );
}
