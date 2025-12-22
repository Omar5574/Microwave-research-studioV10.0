// src/components/simulation/WaveformDisplay.jsx
import React, { useEffect, useRef } from 'react';

export function WaveformDisplay({ deviceId, inputs, running, timeScale }) {
  const canvasRef = useRef(null);
  const dataRef = useRef([]);
  const frameRef = useRef(0);

  useEffect(() => {  
   const canvas = canvasRef.current;  
   if (!canvas) return;  
   const ctx = canvas.getContext('2d');  
   let animationFrameId;  
  
   // Helper to keep drawing relative
   // We will calculate 'midPoint' inside the loop

   const drawBandDiagram = (cx, cy, w, h, Eg = 1.42, shift = 0) => {
     // Scaled width for the diagram based on available space
     const top = cy - h / 2;
     const bottom = cy + h / 2;
     const EcY = top + h * 0.25;  
     const EvY = bottom - h * 0.25; 
  
     // Conduction Band
     ctx.strokeStyle = "#38bdf8";
     ctx.lineWidth = 2;
     ctx.beginPath();
     ctx.moveTo(cx - w/2, EcY); 
     ctx.lineTo(cx + w/2, EcY - shift * 10); 
     ctx.stroke();
  
     // Valence Band
     ctx.strokeStyle = "#f87171";
     ctx.beginPath();
     ctx.moveTo(cx - w/2, EvY); 
     ctx.lineTo(cx + w/2, EvY - shift * 10 / 1.2); 
     ctx.stroke();
  
     // Gap shading
     ctx.fillStyle = "rgba(255,255,255,0.04)";
     ctx.fillRect(cx - w/2, EcY, w, EvY - EcY);
  
     // Labels
     ctx.fillStyle = "#38bdf8";
     ctx.font = "9px monospace";
     ctx.fillText("Ec", cx - w/2 - 14, EcY + 3);
  
     ctx.fillStyle = "#f87171";
     ctx.fillText("Ev", cx - w/2 - 14, EvY + 3);
   }

   const drawElectricField = (cx, cy, w, amp = 1) => {
     ctx.strokeStyle = "rgba(250,250,120,0.8)";
     ctx.lineWidth = 2;
     ctx.beginPath();
     for (let i = 0; i <= w; i++) {
       const x = cx - w/2 + i;
       const y = cy - Math.sin(i * 0.04) * 18 * amp;
       if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
     }
     ctx.stroke();
     ctx.fillStyle = "yellow";
     ctx.font = "9px monospace";
     ctx.fillText("E(x)", cx - w/2, cy - 25 * amp);
   }
  
   const drawPotential = (cx, cy, w, V=1) => {
     ctx.strokeStyle = "#3b82f6";
     ctx.lineWidth = 2;
     ctx.beginPath();
     for (let i = 0; i <= w; i++) {
       const x = cx - w/2 + i;
       const y = cy - (i/w) * 35 * (V/10);
       if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
     }
     ctx.stroke();
     ctx.fillStyle = "#3b82f6";
     ctx.font = "9px monospace";
     ctx.fillText("V(x)", cx - w/2, cy - 40);
   }
  
   // ==============================
   // MAIN DRAW LOOP
   // ==============================
   const loop = () => {  
     // Responsive Resizing: Matches CSS size
     canvas.width = canvas.clientWidth;  
     canvas.height = canvas.clientHeight;
     
     const width = canvas.width;
     const height = canvas.height;
     const midPoint = width / 2;
       
     ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';  
     ctx.fillRect(0, 0, width, height);  

     // Divider Line (Dynamic Position)
     ctx.strokeStyle = '#334155';
     ctx.lineWidth = 2;
     ctx.beginPath();
     ctx.moveTo(midPoint, 0);
     ctx.lineTo(midPoint, height);
     ctx.stroke();

     // Main Labels
     ctx.font = '10px monospace';
     ctx.fillStyle = '#94a3b8';
     
     if (['gunn', 'tunnel', 'impatt', 'trapatt'].includes(deviceId)) {
         ctx.fillText('DEVICE PHYSICS', 5, 12);
     }
     ctx.fillText('OSCILLOSCOPE', midPoint + 5, 12);
  
     if (running) {  
       frameRef.current += timeScale;  
       let val1 = 0; let val2 = 0; let omega = 0.15;
  
       // Physics Diagram Center Point (Left Side)
       const phyCX = midPoint / 2;
       const phyWidth = midPoint * 0.8; // Use 80% of left side width

       // ============================  
       // SOLID STATE DEVICES
       // ============================ 
       if (deviceId === 'gunn') {    
         const L = inputs.L || 10;  
         const vd = inputs.vd || 1e7;  
         const freq = (vd / (L * 1e-4)) / 1e9;  
         omega = freq * 0.3;  
         val1 = Math.sin(frameRef.current * omega) * 0.9;  
  
         drawBandDiagram(phyCX, 130, phyWidth, 60, 1.42, val1);
         drawElectricField(phyCX, 110, phyWidth*0.9, val1);
         drawPotential(phyCX, 75, phyWidth*0.9, inputs.V);
       }    
       else if (deviceId === 'tunnel') {    
         omega = 0.12 * ((inputs.V || 150) / 100 + 1);    
         val1 = Math.sin(frameRef.current * omega) * 0.6 * Math.exp(-Math.sin(frameRef.current * 0.03) * 0.2);    
         drawBandDiagram(phyCX, 130, phyWidth, 60, 1.5, val1);
         drawElectricField(phyCX, 110, phyWidth*0.9, val1*0.7);
         drawPotential(phyCX, 75, phyWidth*0.9, inputs.V/10);
       }    
       else if (deviceId === 'impatt') {    
         omega = 0.18 * ((inputs.Vd || 90) / 100);    
         val1 = Math.sin(frameRef.current * omega) * 1.0;    
         val2 = Math.sin(frameRef.current * omega + Math.PI) * 0.8;    
         drawBandDiagram(phyCX, 130, phyWidth, 60, 1.35, val1);
         drawElectricField(phyCX, 110, phyWidth*0.9, val1*1.2);
         drawPotential(phyCX, 75, phyWidth*0.9, inputs.Vd/10);
       }    
       else if (deviceId === 'trapatt') {    
         const pulse = Math.sin(frameRef.current * 0.08);    
         val1 = pulse > 0.5 ? 1.2 : -0.3;    
         drawBandDiagram(phyCX, 130, phyWidth, 60, 1.3, val1);
         drawElectricField(phyCX, 110, phyWidth*0.9, val1*1.4);
         drawPotential(phyCX, 75, phyWidth*0.9, inputs.V/20);
       }
       else {
           // TUBE DEVICES
           let currentFreq = inputs.f || 3;
           if (deviceId === 'magnetron') {
              const tuneFactor = 1 + (inputs.tune || 0) / 100;
              currentFreq = (inputs.f || 3) * tuneFactor;
           }
           omega = 0.1 * currentFreq;
           
           if (deviceId === 'klystron2' || deviceId === 'klystronMulti') {
              val1 = Math.sin(frameRef.current * omega) * 0.4; 
              val2 = Math.sin(frameRef.current * omega - 2) * 0.8; 
           } else if (deviceId === 'twt') {
              val1 = Math.sin(frameRef.current * omega) * 0.4;
              val2 = Math.sin(frameRef.current * omega - 1) * 1.0; 
           } else {
              val1 = Math.sin(frameRef.current * omega);
           }
       }
  
       dataRef.current.push({v1: val1, v2: val2});  
       if (dataRef.current.length > width / 2) dataRef.current.shift(); // Keep buffer sized to screen
     }  
     
     // Grid for Scope (Right Side)
     ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)'; 
     ctx.lineWidth = 1;
     for (let i = 0; i <= 5; i++) { 
         ctx.beginPath(); 
         ctx.moveTo(midPoint, i * 30);
         ctx.lineTo(width, i * 30); 
         ctx.stroke(); 
     }

     // Output Waveform (Red)
     ctx.strokeStyle = '#ef4444';
     ctx.lineWidth = 2;
     ctx.beginPath();
     dataRef.current.forEach((d, i) => {
       const x = midPoint + i * (midPoint / 200); // Scale X to fit right side
       const y = 75 + d.v1 * 40;
       if (i === 0) ctx.moveTo(x,y);
       else ctx.lineTo(x,y);
     });
     ctx.stroke();

     // Input Waveform (Blue)
     if(['klystron2', 'klystronMulti', 'twt'].includes(deviceId)) {
        ctx.beginPath(); 
        ctx.strokeStyle = '#3b82f6';
        dataRef.current.forEach((d, i) => { 
            const x = midPoint + i * (midPoint / 200);
            const y = 75 + d.v2 * 40; 
            if (i === 0) ctx.moveTo(x, y); 
            else ctx.lineTo(x, y); 
        });
        ctx.stroke();
     }

     // Labels
     ctx.font = '10px monospace';
     if(['klystron2', 'klystronMulti', 'twt'].includes(deviceId)) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('INPUT (V1)', midPoint + 5, 25);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('OUTPUT (High Power)', midPoint + 5, 38);
     }
  
     animationFrameId = requestAnimationFrame(loop);  
   };  
  
   loop();  
   return () => cancelAnimationFrame(animationFrameId);  
  
  }, [deviceId, inputs, running, timeScale]);

  return (
    // Replaced fixed w-full h-full with specific responsive styles if needed in parent
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 shadow-2xl w-full h-full min-h-[150px]">
      <canvas ref={canvasRef} className="rounded w-full h-full block" />
    </div>
  );
}

export default WaveformDisplay;
