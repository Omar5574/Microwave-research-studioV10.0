// ============================================================================
// src/components/features/ExpertQuery.jsx
// AI-Powered Chat Interface for Microwave Engineering Guidance
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';

function ExpertQuery({ show, onClose, onQuery, loading, deviceName, history, currentInputs }) {
  const [inputQuery, setInputQuery] = useState('');
  const historyEndRef = useRef(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => {
          try {
            window.MathJax.typesetPromise();
          } catch(e) { console.warn("MathJax typeset error", e); }
      }, 100);
    }
  }, [history, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputQuery.trim() && !loading) {
      onQuery(inputQuery);
      setInputQuery('');
    }
  };

  if (!show) return null;

  const renderText = (text) => {
    if (!text) return null;
    const safeText = typeof text === 'string' ? text : String(text);

    return safeText.split('\n').map((line, index) => (
      <p key={index} className="mb-1">
        {line.split(/(\$\$[^$]*\$\$|\$[^$]*\$)/g).map((part, i) => {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            return <span key={i} className="block my-2 text-lg text-purple-300 font-mono overflow-x-auto">{`\\[ ${part.slice(2, -2).trim()} \\]`}</span>;
          }
          if (part.startsWith('$') && part.endsWith('$')) {
            return <span key={i} className="text-emerald-300 font-mono">{`\\( ${part.slice(1, -1).trim()} \\)`}</span>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full max-h-[90vh] bg-slate-900 rounded-xl shadow-2xl border border-blue-700/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-blue-700 flex justify-between items-center bg-blue-900/20">
          <h3 className="text-lg font-bold text-blue-400">µW-Expert: {deviceName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-sm bg-slate-950/50">
          {history.length === 0 && (
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 text-slate-300 shadow-md">
              <p className="font-bold text-lg mb-2">مرحباً يا عمر! أنا خبير محاكاة الموجات الدقيقة.</p>
              <p className="mb-2">بصفتي مساعدك الذكي، يمكنني مساعدتك في فهم:</p>
              <ul className="list-disc list-inside text-slate-400 ml-2 space-y-1">
                 <li>نظرية عمل {deviceName}</li>
                 <li>تأثير تغيير المعاملات (Parameters)</li>
                 <li>المعادلات الرياضية والفيزيائية</li>
              </ul>
              <p className="text-xs mt-3 text-slate-500 border-t border-slate-700 pt-2 font-mono">الحالة الحالية: {currentInputs}</p>
            </div>
          )}
          {history.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl shadow-md leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 bg-slate-800 flex items-center gap-3">
          <input 
            type="text" 
            value={inputQuery} 
            onChange={(e) => setInputQuery(e.target.value)} 
            placeholder={loading ? 'جاري التحليل...' : `اسأل عن ${deviceName}...`} 
            disabled={loading} 
            className="flex-1 p-3 rounded-lg bg-slate-900 text-white border border-slate-600 focus:border-blue-500 outline-none transition-all placeholder-slate-500" 
          />
          <button 
            type="submit" 
            disabled={loading || !inputQuery.trim()} 
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg ${
                loading || !inputQuery.trim() 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
            }`}
          >
            {loading ? <span className="animate-pulse">...</span> : 'إرسال'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ========== USAGE EXAMPLE ==========
/*
import { ExpertQuery } from './components/features/ExpertQuery';

function ParentComponent() {
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (query) => {
    setLoading(true);
    
    // Add user message
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    
    // Make API call
    const response = await yourAPICall(query);
    
    // Add AI response
    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setShowChat(true)}>Open Chat</button>
      
      <ExpertQuery
        show={showChat}
        onClose={() => setShowChat(false)}
        onQuery={handleQuery}
        loading={loading}
        deviceName="Two-Cavity Klystron"
        history={chatHistory}
        currentInputs="Vo: 10 kV, f: 3 GHz"
      />
    </>
  );
}
*/