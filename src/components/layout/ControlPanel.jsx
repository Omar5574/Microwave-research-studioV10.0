import React from 'react';
import { TheoryPanel } from '../panels/TheoryPanel';

export function ControlPanel({ 
  device, 
  inputs, 
  setInputs, 
  safeInputs,
  mathMode,
  setMathMode,
  showWaveform,
  setShowWaveform,
  showFFT,
  setShowFFT
}) {
  return (
    <div className="h-80 bg-[#0f1115] border-t border-slate-800 flex z-20 shrink-0">
      {/* Parameters Grid */}
      <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 overflow-y-auto custom-scrollbar">
        {device.params.map(p => (
          <div key={p.id} className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-all">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-blue-300">{p.label}</label>
              <span className="text-xs font-mono bg-black/50 px-3 py-0.5 rounded text-emerald-400 border border-emerald-900/30">
                {(inputs[p.id] !== undefined ? inputs[p.id] : p.def).toFixed(p.step >= 1 ? 0 : (p.step >= 0.1 ? 1 : 2))} {p.unit}
              </span>
            </div>
            <input 
              type="range" 
              min={p.min} 
              max={p.max} 
              step={p.step} 
              value={inputs[p.id] !== undefined ? inputs[p.id] : p.def} 
              onChange={(e) => setInputs(prev => ({...prev, [p.id]: parseFloat(e.target.value)}))} 
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Theory Panel */}
      <TheoryPanel 
        device={device}
        safeInputs={safeInputs}
        mathMode={mathMode}
        setMathMode={setMathMode}
        showWaveform={showWaveform}
        setShowWaveform={setShowWaveform}
        showFFT={showFFT}
        setShowFFT={setShowFFT}
      />
    </div>
  );
}