// src/components/simulation/FFTDisplay.jsx
import React, { useEffect, useRef } from 'react';

export function FFTDisplay({ deviceId, inputs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Make Canvas Responsive
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight || 150;

    const width = canvas.width;
    const height = canvas.height;

    // Cleaning the canvas
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

   // 1. Draw the grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 30) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 30) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 2. Calculate the peak position
    let freq = inputs?.f || inputs?.freq || 5; 
    if (deviceId === 'magnetron' && inputs?.tune !== undefined) {
      freq = freq * (1 + inputs.tune / 100);
    }
    const maxFreqDisplay = 20; 
    const peakX = (freq / maxFreqDisplay) * width;

    // 3. Drawing the Spectrum Curve
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)'); 

    for (let x = 0; x < width; x++) {
      let noise = Math.random() * 5;
      
      let distance = Math.abs(x - peakX);
      let peakHeight = (height * 0.8) / (1 + Math.pow(distance / 3, 2)); // Dynamic height
      
      let harmonic2 = (height * 0.25) / (1 + Math.pow(Math.abs(x - peakX * 2) / 3, 2));

      let y = height - 20 - peakHeight - harmonic2 - noise;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = '#ef4444'; 
    ctx.stroke();
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 4. Text Labels
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    // Ensure text stays within bounds
    let textX = peakX - 15;
    if (textX < 5) textX = 5;
    if (textX > width - 40) textX = width - 40;
    
    ctx.fillText(`${freq.toFixed(1)} GHz`, textX, height - 130);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('0', 5, height - 5);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxFreqDisplay}GHz`, width - 5, height - 5);
    ctx.textAlign = 'center';
    ctx.fillText('POWER (dBm)', width / 2, 12);

  }, [inputs, deviceId]); // Added deviceId dependency

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md w-full h-full min-h-[150px]">
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Real-time FFT Analysis</h4>
        <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[8px] text-red-500 font-mono">LIVE</span>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full rounded-lg border border-slate-800/50 block"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}

export default FFTDisplay;
