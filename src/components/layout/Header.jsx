import React from 'react';

export function Header({ 
  activeTab, setActiveTab, 
  fidelity, setFidelity,
  timeScale, setTimeScale,
  running, setRunning,
  onChatOpen
}) {
  return (
    <header className="h-16 border-b border-slate-800 bg-gradient-to-r from-[#0a0a0f] to-[#0f1115] flex items-center justify-between px-6 z-20 shadow-lg shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl text-xl">µW</div>
        <div>
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Microwave Research Studio
          </h1>
          <div className="text-[10px] text-slate-500 font-mono">V9.4 REFACTORED</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Tab Switcher */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 mr-4">
          <button 
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
              activeTab === 'simulation' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Simulation
          </button>
          <button 
            onClick={() => setActiveTab('explanation')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
              activeTab === 'explanation' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Deep Explanation
          </button>
        </div>

        {/* Fidelity Selector */}
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

        {/* Chat Button */}
        <button 
          onClick={onChatOpen}
          className="px-4 py-2 rounded-lg font-bold transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
          Ask µW-Expert
        </button>

        {/* Status & Control */}
        <div className={`px-4 py-2 rounded-lg border transition-all ${
          running ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-yellow-500/30 bg-yellow-900/20 text-yellow-400'
        }`}>
          <div className="text-[10px] font-bold">{running ? "● LIVE" : "⏸ PAUSED"}</div>
        </div>
        
        <button 
          onClick={() => setRunning(!running)} 
          className={`px-5 py-2 rounded-lg font-bold transition-all shadow-lg text-sm ${
            running ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {running ? "Pause" : "Resume"}
        </button>
      </div>
    </header>
  );
}