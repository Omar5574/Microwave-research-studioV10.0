// src/components/layout/Header.jsx
import React from 'react';

export function Header({ 
  activeTab, setActiveTab, 
  fidelity, setFidelity,
  timeScale, setTimeScale,
  running, setRunning,
  onChatOpen,
  onMenuToggle // New prop for menu toggle
}) {
  return (
    <header className="h-16 border-b border-slate-800 bg-gradient-to-r from-[#0a0a0f] to-[#0f1115] flex items-center justify-between px-4 md:px-6 z-20 shadow-lg shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button (Hamburger) */}
        <button 
          onClick={onMenuToggle}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>

        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl text-lg md:text-xl">µW</div>
        <div>
          <h1 className="text-sm md:text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
             <span className="md:hidden">MRS v9.4</span> {/* Short name for mobile */}
             <span className="hidden md:inline">Microwave Research Studio</span>
          </h1>
          <div className="hidden md:block text-[10px] text-slate-500 font-mono">V9.4 REFACTORED</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        {/* Tab Switcher - Compact on mobile */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={() => setActiveTab('simulation')}
            className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded transition-all ${
              activeTab === 'simulation' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sim
          </button>
          <button 
            onClick={() => setActiveTab('explanation')}
            className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded transition-all ${
              activeTab === 'explanation' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Doc
          </button>
        </div>

        {/* Fidelity & TimeScale - Hidden on Mobile */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700">
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

        <div className="hidden lg:flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700">
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
        </div>

        {/* Chat Button - Compact */}
        <button 
          onClick={onChatOpen}
          className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold transition-all shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 text-xs md:text-sm"
        >
          <span className="md:hidden">AI</span>
          <span className="hidden md:inline">Ask AI</span>
        </button>

        {/* Status & Control - Compact */}
        <button 
          onClick={() => setRunning(!running)} 
          className={`w-8 h-8 md:w-auto md:px-5 md:py-2 flex items-center justify-center rounded-lg font-bold transition-all shadow-lg text-xs ${
            running ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {running ? <span className="md:hidden">⏸</span> : <span className="md:hidden">▶</span>}
          <span className="hidden md:inline">{running ? "Pause" : "Resume"}</span>
        </button>
      </div>
    </header>
  );
}
