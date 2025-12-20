export function FFTDisplay({ deviceId, inputs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = 250;
    canvas.height = 150;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 250, 150);

    let effectiveFreq = inputs.f || 3;
    
    if (deviceId === 'gunn') {
      const L = inputs.L || 10;
      const vd = inputs.vd || 1e7;
      effectiveFreq = (vd / (L * 1e-4)) / 1e9;
    }
    else if (deviceId === 'tunnel') {
      effectiveFreq = (inputs.V || 150) / 100 + 1;
    }
    else if (deviceId === 'impatt') {
      effectiveFreq = (inputs.Vd || 90) / 50;
    }
    else if (deviceId === 'trapatt') {
      effectiveFreq = 1.0 + Math.sin((inputs.V || 100) / 50);
    }
    else if (deviceId === 'magnetron' && inputs.tune) {
         const tuneFactor = 1 + (inputs.tune / 100) * 0.25;
         effectiveFreq *= tuneFactor;
    }

    const numBars = 40;
    const barWidth = 250 / numBars;

    // Grid
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)'; 
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) { 
      ctx.beginPath(); 
      ctx.moveTo(0, i * 30); 
      ctx.lineTo(250, i * 30); 
      ctx.stroke(); 
    }

    // Spectrum Bars
    for (let i = 0; i < numBars; i++) {
      const f_bin = i * 0.5; 
      let magnitude = 0;
      
      if (Math.abs(f_bin - effectiveFreq) < 0.6) magnitude = 1.0;
      
      if (['klystron2', 'klystronMulti'].includes(deviceId) && Math.abs(f_bin - effectiveFreq * 3) < 0.5) {
        magnitude = 0.3;
      }
      
      if (deviceId === 'magnetron') {
          if(Math.abs(f_bin - effectiveFreq * 2) < 0.5) magnitude = 0.2;
          magnitude += Math.random() * 0.05; 
      }
      
      magnitude += Math.random() * 0.02; 

      const barHeight = magnitude * 120;
      const gradient = ctx.createLinearGradient(0, 150 - barHeight, 0, 150);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(1, '#f59e0b');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, 150 - barHeight, barWidth - 1, barHeight);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('SPECTRUM (FFT)', 5, 12);
    
    ctx.textAlign = 'right';
    ctx.fillText(`${effectiveFreq.toFixed(2)} GHz`, 245, 12);

  }, [deviceId, inputs]);

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 shadow-2xl">
      <canvas ref={canvasRef} className="rounded w-full h-full" />
    </div>
  );
}