import React from 'react';

export function Sidebar({ devices, activeId, setActiveId }) {
  const categories = ['O-TYPE', 'CROSSED-FIELD (M-TYPE)', 'SOLID-STATE', 'QUANTUM EFFECT', 'AVALANCHE TRANSIT'];
  
  return (
    <aside className="w-72 bg-[#0a0a0a] border-r border-slate-800 flex flex-col z-10 shadow-2xl shrink-0 overflow-hidden">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Device Library</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {categories.map(cat => {
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
  );
}