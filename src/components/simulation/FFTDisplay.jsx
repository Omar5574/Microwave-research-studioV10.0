// src/components/simulation/FFTDisplay.jsx
import React, { useEffect, useRef } from 'react';

export function FFTDisplay({ deviceId, inputs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // إعداد أبعاد الـ Canvas
    canvas.width = 250;
    canvas.height = 150;

    // خلفية سوداء (أو شفافة حسب التصميم)
    ctx.fillStyle = '#0f172a'; // لون slate-900 تقريباً
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم شبكة (Grid) بسيطة
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 25) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 25) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // محاكاة رسم بيانات FFT (تمثيل ترددي وهمي)
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444'; // لون أحمر
    ctx.lineWidth = 2;
    
    // إنشاء موجات عشوائية لمحاكاة الطيف الترددي بناءً على المدخلات
    const frequencyFactor = inputs?.f ? parseFloat(inputs.f) : 1;
    
    for (let i = 0; i < canvas.width; i++) {
        // معادلة بسيطة لرسم "أعمدة" الطيف
        const amplitude = Math.sin(i * 0.1 * frequencyFactor) * Math.random() * 50;
        // رسم خط من الأسفل إلى الارتفاع المحسوب
        // هنا سنرسم مجرد خط متصل يمثل الغلاف (Envelope) للتبسيط
        const y = canvas.height - Math.abs(amplitude) - 10; 
        
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
    }
    ctx.stroke();

    // إضافة نص توضيحي
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('Frequency (GHz)', 10, canvas.height - 5);

  }, [inputs]); // إعادة الرسم عند تغير المدخلات

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-inner">
      <h4 className="text-xs text-slate-400 mb-2 font-mono text-center">FFT Spectrum Analysis</h4>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full rounded bg-black/50"
      />
    </div>
  );
}

export default FFTDisplay;
