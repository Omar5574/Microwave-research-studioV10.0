// src/components/panels/TheoryPanel.jsx
import React from 'react';

export function TheoryPanel({ 
  device, 
  safeInputs, 
  mathMode, 
  setMathMode, 
  showWaveform, 
  setShowWaveform, 
  showFFT, 
  setShowFFT 
}) {
  return (
    // Modified: w-full for mobile, w-96 for desktop
    // Modified: Top border on mobile, left border on desktop
    <div className="w-full md:w-96 bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0">
      {/* Theory Section */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Governing Equations</h3>
          <div className="flex gap-1 bg-slate-900 rounded p-0.5">
            <button 
              onClick={() => setMathMode('plain')}
              className={`px-2 py-1 text-[10px] rounded transition-all ${
                mathMode === 'plain' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Plain
            </button>
            <button 
              onClick={() => setMathMode('latex')}
              className={`px-2 py-1 text-[10px] rounded transition-all ${
                mathMode === 'latex' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              LaTeX
            </button>
          </div>
        </div>
        
        <div className="bg-slate-900/50 p-3 rounded border border-slate-800/50 max-h-32 overflow-y-auto custom-scrollbar">
          {mathMode === 'plain' ? (
            <div className="text-xs font-mono text-slate-300 leading-relaxed">
              {device.theory.plain}
            </div>
          ) : (
            <div className="text-xs text-slate-300 overflow-x-auto flex flex-col gap-2">
              {device.theory.latex.split(',').map((eq, i) => (
                <div key={i}>{`\\[ ${eq.trim()} \\]`}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Calculations */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar max-h-40 md:max-h-full">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Parameters</h3>
        <div className="space-y-2">
          {Object.entries(device.equations(safeInputs)).map(([key, val]) => (
            <div key={key} className="bg-gradient-to-r from-slate-900/80 to-slate-800/40 p-3 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-blue-300">{key}</span>
                <span className="text-xs font-mono bg-black/50 px-2 py-0.5 rounded text-emerald-400 border border-emerald-900/30">
                  {String(val.value)} {String(val.unit)}
                </span>
              </div>
              {mathMode === 'latex' && val.latex && (
                <div className="text-[10px] text-slate-400 mt-1">{`\\(${val.latex}\\)`}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Display Toggles */}
      <div className="p-4 border-t border-slate-800 flex gap-2 shrink-0">
        <button 
          onClick={() => setShowWaveform(!showWaveform)}
          className={`flex-1 px-3 py-2 text-xs rounded transition-all ${
            showWaveform ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Waveform
        </button>
        <button 
          onClick={() => setShowFFT(!showFFT)}
          className={`flex-1 px-3 py-2 text-xs rounded transition-all ${
            showFFT ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          FFT
        </button>
      </div>
    </div>
  );
}
