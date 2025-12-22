// src/components/layout/Sidebar.jsx
import React from 'react';

export function Sidebar({ devices, activeId, setActiveId }) {
  const categories = ['O-TYPE', 'CROSSED-FIELD (M-TYPE)', 'SOLID-STATE', 'QUANTUM EFFECT', 'AVALANCHE TRANSIT'];
  
  return (
    // Modified: Added 'h-full' to ensure it fills the vertical space
    // Modified: 'w-64' on mobile, 'w-72' on desktop for better responsiveness
    <aside className="w-64 md:w-72 h-full bg-[#0a0a0a] border-r border-slate-800 flex flex-col z-30 shadow-2xl shrink-0 overflow-hidden transition-all">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Device Library</h2>
      </div>
      
      {/* Scrollable Device List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {categories.map(cat => {
          const categoryDevices = devices.filter(d => d.type === cat);
          if (categoryDevices.length === 0) return null;
          
          return (
            <div key={cat}>
              {/* Category Label */}
              <div className="px-2 py-1 text-[10px] text-blue-400 font-bold mb-1 uppercase tracking-wider bg-blue-900/10 rounded border border-blue-900/20">
                {cat}
              </div>
              
              {/* Device Buttons List */}
              <div className="space-y-1">
                {categoryDevices.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => setActiveId(d.id)} 
                    className={`w-full text-left px-4 py-3 rounded-lg text-xs transition-all border ${
                      activeId === d.id 
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                        : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold truncate">{d.name}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
