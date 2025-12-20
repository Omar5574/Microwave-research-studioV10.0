import React from 'react';

export function DeepExplanation({ device }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-12 max-w-5xl mx-auto">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h2 className="text-4xl font-bold text-white mb-2">{device.name}</h2>
        <div className="text-purple-400 font-mono text-sm tracking-widest uppercase mb-4">
          Deep Research Explanation
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">{device.desc}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-20">
        {device.explanation && device.explanation.map((section, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
            <h3 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/30 text-blue-400 text-sm border border-blue-800">
                {idx + 1}
              </span>
              {section.title}
            </h3>
            <p className="text-slate-300 mb-6 leading-relaxed text-sm text-justify">
              {section.text}
            </p>
            {section.eq && (
              <div className="bg-black/40 rounded-lg p-6 border-l-4 border-purple-500 flex justify-center overflow-x-auto">
                <div className="text-lg text-purple-200">
                  {`\\[ ${section.eq} \\]`}
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-blue-100 mb-4">Core Theory Summary</h3>
          <div className="text-slate-300 text-sm space-y-2 font-mono bg-black/20 p-4 rounded-lg">
            {device.theory.latex.split(',').map((eq, i) => (
              <div key={i} className="py-2 border-b border-slate-800/50 last:border-0">
                {`\\( ${eq.trim()} \\)`}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}