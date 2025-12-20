// المسار: src/components/features/ExpertQuery.jsx
import React, { useEffect, useRef, useState } from 'react';

// هذا الملف مسؤول فقط عن العرض (UI) ولا يتصل بـ Google مباشرة
function ExpertQuery({ show, onClose, onQuery, loading, deviceName, history, currentInputs }) {
  const [inputQuery, setInputQuery] = useState('');
  const historyEndRef = useRef(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputQuery.trim() && !loading) {
      onQuery(inputQuery);
      setInputQuery('');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-[80vh] bg-slate-900 rounded-xl border border-blue-500/30 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h3 className="text-blue-400 font-bold flex items-center gap-2">
            🤖 مساعد {deviceName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold">&times;</button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
          {history.length === 0 && (
            <div className="text-center text-slate-500 mt-10">
              <p>مرحباً يا عمر! أنا جاهز للإجابة عن أسئلتك بخصوص {deviceName}.</p>
            </div>
          )}
          
          {history.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-700 text-slate-200 rounded-tl-none'
              }`}>
                {/* هنا نعرض النص ونحول الرموز الرياضية إن وجدت */}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input 
            type="text" 
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="اكتب سؤالك هنا..." 
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !inputQuery.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : 'إرسال'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ExpertQuery;
