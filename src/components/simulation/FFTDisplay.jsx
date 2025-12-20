import React, { useEffect, useRef } from 'react';

export function FFTDisplay({ deviceId, inputs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // إعداد الأبعاد
    canvas.width = 300;
    canvas.height = 150;

    // تنظيف الـ Canvas بخلفية داكنة جداً
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. رسم الشبكة (Grid) بلون باهت
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 30) {
      ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += 30) {
      ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // 2. حساب موقع القمة (Peak) بناءً على التردد المدخل
    // نفترض أن التردد المتاح في المدخلات هو f أو freq
    let freq = inputs?.f || inputs?.freq || 5; // قيمة افتراضية 5 GHz
    if (deviceId === 'magnetron' && inputs?.tune !== undefined) {
  freq = freq * (1 + inputs.tune / 100);
}
    const maxFreqDisplay = 20; // أقصى تردد معروض على الشاشة
    const peakX = (freq / maxFreqDisplay) * canvas.width;

    // 3. رسم منحنى الطيف (Spectrum Curve)
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    // إنشاء تدرج لوني للمنحنى (Glow effect)
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');   // شفاف من الأسفل
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)'); // أحمر خفيف في الأعلى

    for (let x = 0; x < canvas.width; x++) {
      // قاعدة الضجيج (Noise Floor)
      let noise = Math.random() * 5;
      
      // معادلة القمة (Lorentzian/Gaussian distribution)
      // كلما اقترب x من الـ peakX، يزداد الارتفاع بشكل حاد
      let distance = Math.abs(x - peakX);
      let peakHeight = 120 / (1 + Math.pow(distance / 3, 2)); // قمة حادة
      
      // إضافة توافقية ثانية (Second Harmonic) بوزن أقل
      let harmonic2 = 40 / (1 + Math.pow(Math.abs(x - peakX * 2) / 3, 2));

      let y = canvas.height - 20 - peakHeight - harmonic2 - noise;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // رسم الخط الخارجي (النبضة)
    ctx.strokeStyle = '#ef4444'; 
    ctx.stroke();

    // ملء المساحة تحت المنحنى بالتدرج
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 4. إضافة نصوص توضيحية احترافية
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(`${freq} GHz`, peakX - 15, canvas.height - 130);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('0', 5, canvas.height - 5);
    ctx.fillText(`${maxFreqDisplay}GHz`, canvas.width - 35, canvas.height - 5);
    ctx.textAlign = 'center';
    ctx.fillText('POWER (dBm)', canvas.width / 2, 12);

  }, [inputs]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Real-time FFT Analysis</h4>
        <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[8px] text-red-500 font-mono">LIVE</span>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto rounded-lg border border-slate-800/50"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}

export default FFTDisplay;
