// src/components/simulation/PhysicsCanvas.jsx
import React, { useEffect, useRef } from 'react';

export function PhysicsCanvas({ deviceId, running, inputs, fidelity, timeScale, particleDensity }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(0);

  // Reset particles on device change
  useEffect(() => { 
    particlesRef.current = []; 
    frameRef.current = 0;
  }, [deviceId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // ========== DRAWING HELPERS ==========
    
    const drawLabel = (text, x, y, color = '#ffffff', align = 'center', font = '10px monospace') => {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    };

    // Semiconductor layer plotting function (improved)
    const drawLayer = (x, y, w, h, color, label, subLabel) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        if (label) drawLabel(label, x + w/2, y + 15, 'rgba(255,255,255,0.9)', 'center', 'bold 11px sans-serif');
        if (subLabel) drawLabel(subLabel, x + w/2, y + h - 10, 'rgba(255,255,255,0.6)');
    };

    // Function for drawing a trapezoid (for a Mesa structure in a Tunnel Diode)
    const drawTrapezoid = (x, y, wTop, wBottom, h, color) => {
        ctx.beginPath();
        ctx.moveTo(x + (wBottom - wTop) / 2, y);
        ctx.lineTo(x + (wBottom - wTop) / 2 + wTop, y);
        ctx.lineTo(x + wBottom, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();
    };

    const drawMetal = (x, y, w, h, type = 'steel') => {
      if (!Number.isFinite(x) || w <= 0 || h <= 0) return;
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      if (type === 'copper') { 
        grad.addColorStop(0, '#5D2E18'); 
        grad.addColorStop(0.5, '#D6885A'); 
        grad.addColorStop(1, '#5D2E18'); 
      } else if (type === 'gold') { 
        grad.addColorStop(0, '#8A6E2F'); 
        grad.addColorStop(0.5, '#FCD34D'); 
        grad.addColorStop(1, '#8A6E2F'); 
      } else if (type === 'glass') {
        grad.addColorStop(0, 'rgba(100,149,237,0.1)');
        grad.addColorStop(0.5, 'rgba(100,149,237,0.2)');
        grad.addColorStop(1, 'rgba(100,149,237,0.1)');
      } else { 
        grad.addColorStop(0, '#1e293b'); 
        grad.addColorStop(0.5, '#475569'); 
        grad.addColorStop(1, '#1e293b'); 
      }
      ctx.fillStyle = grad; 
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; 
      ctx.lineWidth = 1; 
      ctx.strokeRect(x, y, w, h);
    };

    const drawCavity = (x, cy, w, h, label) => {
      if (!Number.isFinite(x)) return;
      drawMetal(x - w/2, cy - h - 20, w, h, 'copper');
      drawMetal(x - w/2, cy + 20, w, h, 'copper');
      
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, cy - 20);
      ctx.lineTo(x, cy + 20);
      ctx.stroke();
      ctx.setLineDash([]);
      
      if (label) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, cy - h - 30);
      }
    };

    const drawElectron = (x, y, radius, colorOverride = null) => {
      ctx.beginPath();
      ctx.fillStyle = colorOverride || '#60a5fa';
      ctx.shadowBlur = colorOverride ? 15 : 8;
      ctx.shadowColor = colorOverride || '#60a5fa';
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    // ========== ANIMATION LOOP ==========
    const loop = () => {
      const width = canvas.width = canvas.clientWidth;
      const height = canvas.height = canvas.clientHeight;
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      if (running) {
        frameRef.current += timeScale;
        
        const MAX_TOTAL_PARTICLES = 35000;
        if (particlesRef.current.length > MAX_TOTAL_PARTICLES) {
            particlesRef.current = particlesRef.current.slice(0, MAX_TOTAL_PARTICLES);
        }
      }

     // ========== TWO-CAVITY KLYSTRON (ENHANCED PHYSICS) ==========
      if (deviceId === 'klystron2') {
          // --- 1. Physics Engine Calculation ---
          const Vo_kv = inputs.Vo || 10;
          const Vo_real = Vo_kv * 1000; 
          // Real Physics Velocity: v = 0.593 * 10^6 * sqrt(Vo)
          const v0_real = 5.93e5 * Math.sqrt(Vo_real); 
          
          const f_GHz = inputs.f || 3;
          const omega_real = 2 * Math.PI * f_GHz * 1e9;
          
          // Gap Coupling (Beta)
          const d_mm = inputs.d || 3;
          const d_meters = d_mm / 1000;
          const transit_angle_rad = (omega_real * d_meters) / v0_real; 
          
          let beta = 1.0;
          const half_theta = transit_angle_rad / 2;
          if (Math.abs(half_theta) > 0.0001) {
              beta = Math.sin(half_theta) / half_theta;
          }

          // Bunching Parameter (X)
          const L_cm = inputs.L || 5;
          const L_meters = L_cm / 100;
          const drift_angle_rad = (omega_real * L_meters) / v0_real; // Theta_0
          const Vi_real = inputs.Vi || 800;
          
          // The Real X Factor determining bunch quality
          const X_real = (beta * Vi_real / (2 * Vo_real)) * drift_angle_rad;

          // Bessel J1 approximation for Output Power Glow
          let J1_X = 0;
          if (X_real < 0.1) J1_X = X_real/2;
          else J1_X = (X_real/2) - (Math.pow(X_real,3)/16) + (Math.pow(X_real,5)/384);
          const output_glow_intensity = Math.min(1, Math.abs(J1_X) * 1.7); // Maximize around 0.58

          // --- 2. Visualization Mapping ---
          // Map Real Velocity to Screen Pixels (non-linear scaling for better viewing)
          // Low Vo (0.5kV) -> slow, High Vo (200kV) -> fast but clamp it
          const v_pixel_base = 3.0 * Math.pow(Vo_kv, 0.4); 
          
          const buncherX = width * 0.2;
          // Distance in pixels proportional to L (cm)
          const catcherX = buncherX + (inputs.L || 5) * 50; 
          
          // Velocity Modulation Depth (fraction of v0)
          // v(t) = v0 * (1 + depth * sin(wt))
          // depth = (beta * Vi) / (2 * Vo)
          const mod_depth = (beta * Vi_real) / (2 * Vo_real);
          
          // Visual Frequency (scales with f but keeps animation viewable)
          const omega_visual = 0.15 * f_GHz; 

          // --- 3. Particle System ---
          if (running) {
            const klystronMaxParticles = 400 * (inputs.Io/200); // More current = More particles
            
            // Injection
            if (particlesRef.current.length < klystronMaxParticles) {
                const injectionCount = Math.ceil(inputs.Io / 100); // Density based on Io
                for (let j = 0; j < injectionCount; j++) {
                  particlesRef.current.push({
                      x: 0 - Math.random() * 10, 
                      y: cy + (Math.random() - 0.5) * 25, 
                      vx: v_pixel_base,
                      base_vx: v_pixel_base,
                      modulated: false,
                      extracted: false, // For energy extraction at catcher
                      type: 'blue'
                  });
                }
            }

            // Update Loop
            particlesRef.current.forEach((p, i) => {
                // A. Buncher Interaction (Velocity Modulation)
                if (!p.modulated && p.x >= buncherX) {
                  const phase = frameRef.current * omega_visual;
                  // Apply modulation based on real physics depth
                  // We multiply mod_depth by a constant to make it visible on screen scale
                  const visual_mod_factor = mod_depth * 150; // visual scaling
                  
                  const sinVal = Math.sin(phase);
                  let v_mod = p.base_vx * (1 + visual_mod_factor * sinVal);
                  
                  // Clamp min velocity to prevent stall
                  if (v_mod < p.base_vx * 0.3) v_mod = p.base_vx * 0.3; 
                  
                  p.vx = v_mod;
                  p.modulated = true;
                  
                  // Color coding
                  if (sinVal > 0.1) p.type = 'fast'; 
                  else if (sinVal < -0.1) p.type = 'slow'; 
                  else p.type = 'neutral';
                }

                // B. Catcher Interaction (Energy Extraction)
                // If bunching is good, particles decelerate here (giving energy to load)
                if (!p.extracted && p.x >= catcherX) {
                    // Simple visual: damp velocity to simulate power loss
                    // In reality, it depends on the retarding field phase
                    p.vx = p.vx * 0.8; 
                    p.extracted = true;
                }

                // Move
                p.x += p.vx * timeScale;

                // Recycle
                const recycleLimit = Math.max(width, catcherX + 150) + 50;
                if (p.x > recycleLimit) {
                  particlesRef.current[i] = {
                      x: 0 - Math.random() * 10,
                      y: cy + (Math.random() - 0.5) * 25,
                      vx: v_pixel_base, 
                      base_vx: v_pixel_base,
                      modulated: false,
                      extracted: false,
                      type: 'blue'
                  };
                }
            });
          }

          // --- 4. Drawing Layers ---
          
          // Drift Tube walls
          drawMetal(0, cy - 60, Math.max(width, catcherX + 100), 20, '#334155');
          drawMetal(0, cy + 40, Math.max(width, catcherX + 100), 20, '#334155');
          
          // BUNCHER (Input)
          // Pulsing Input Signal color
          const in_signal = Math.sin(frameRef.current * omega_visual);
          const buncherColor = in_signal > 0 ? '#60a5fa' : '#3b82f6';
          drawCavity(buncherX, cy, 60, 90, 'RF IN', buncherColor);

          // CATCHER (Output)
          // Glow intensity depends on J1(X) - Real Physics!
          const outOpacity = 0.2 + 0.8 * output_glow_intensity;
          const catcherGlow = `rgba(244, 63, 94, ${outOpacity})`; // Pink/Red glow
          
          // Draw Glow Halo
          if (output_glow_intensity > 0.3) {
             ctx.beginPath();
             ctx.arc(catcherX + 25, cy, 60 * output_glow_intensity, 0, Math.PI*2);
             ctx.fillStyle = `rgba(244, 63, 94, ${output_glow_intensity * 0.3})`;
             ctx.fill();
          }
          drawCavity(catcherX, cy, 60, 90, 'RF OUT', catcherGlow);

          // COLLECTOR
          const collectorX = Math.max(width - 60, catcherX + 100);
          drawMetal(collectorX, cy - 50, 60, 100, '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('COLLECTOR', collectorX + 5, cy + 5);

          // INFO HUD (Physics Feedback)
          ctx.fillStyle = '#fff';
          ctx.font = '14px monospace';
          ctx.fillText(`Bunching Param (X): ${X_real.toFixed(3)}`, 20, 30);
          
          let statusText = "";
          let statusColor = "#94a3b8";
          
          if (X_real < 1.0) { statusText = "UNDER-BUNCHED (Increase L or Vi)"; statusColor = "#facc15"; }
          else if (X_real >= 1.8 && X_real <= 1.9) { statusText = "OPTIMAL BUNCHING (Max Power!)"; statusColor = "#4ade80"; }
          else if (X_real > 2.0) { statusText = "OVER-BUNCHED (Crossover)"; statusColor = "#f87171"; }
          else { statusText = "GOOD BUNCHING"; statusColor = "#60a5fa"; }
          
          ctx.fillStyle = statusColor;
          ctx.fillText(statusText, 20, 50);

          // Electrons
          particlesRef.current.forEach(p => {
              let color = '#60a5fa'; 
              if (p.type === 'fast') color = '#ef4444'; // Red for fast
              if (p.type === 'slow') color = '#fbbf24'; // Amber for slow
              drawElectron(p.x, p.y, 3, color);
          });
      }
        // === MULTI-CAVITY KLYSTRON ===
        else if (deviceId === 'klystronMulti') {
           // 1. Physics Calculations
           const Vo_kv = inputs.Vo || 15;
           const Vo_real = Vo_kv * 1000;
           const v0_real = 5.93e5 * Math.sqrt(Vo_real);
           const f_GHz = inputs.f || 3;
           const omega_real = 2 * Math.PI * f_GHz * 1e9;
           const d_mm = inputs.d || 3; 
           const d_meters = d_mm / 1000;
           const Vi_real = inputs.Vi || 500;
 
           // Coupling Coefficient Beta
           const transit_angle_rad = (omega_real * d_meters) / v0_real;
           let beta = 1.0;
           const half_theta = transit_angle_rad / 2;
           if (Math.abs(half_theta) > 0.0001) beta = Math.sin(half_theta) / half_theta;
 
           // Optimum Drift Length (L_opt) Calculation
           const safe_Vi = Math.max(Vi_real, 10); 
           const L_opt_meters = (3.682 * Vo_real * v0_real) / (omega_real * beta * safe_Vi);
           const L_opt_cm = L_opt_meters * 100;
           
           // 2. Geometry Setup (Dynamic Scaling)
           const N = Math.floor(inputs.N || 4);
           let px_per_cm = 60; 
           const buncherX_start = width * 0.15;
           const required_visual_length = (N - 1) * (L_opt_cm * px_per_cm) + 200; 
           
           if (required_visual_length > width) {
              const available_width = width - buncherX_start - 100;
              const total_L_cm = (N - 1) * L_opt_cm;
              if (total_L_cm > 0) px_per_cm = available_width / total_L_cm;
           }
           
           let L_opt_pixels = L_opt_cm * px_per_cm;
           if (!Number.isFinite(L_opt_pixels) || L_opt_pixels < 20) L_opt_pixels = 60; 
 
           const cavityPositions = [];
           for (let i = 0; i < N; i++) cavityPositions.push(buncherX_start + i * L_opt_pixels);
           const catcherX = cavityPositions[N - 1]; 
           const collectorX = catcherX + 80;
           const totalLength = collectorX + 60;
           
           const v_pixel_base = 6.0 * Math.sqrt(Vo_kv / 15); 
           
           const omega_visual = 0.2;
 
           // 3. Particle Logic
           if (running) {
             const multiMaxParticles = 6000 * particleDensity; 
             if (particlesRef.current.length < multiMaxParticles) {
                 const injectionCount = Math.ceil(particleDensity * 2);
                 for(let j=0; j<injectionCount; j++){
                     particlesRef.current.push({ 
                     x: 0 - Math.random() * 5, y: cy + (Math.random() - 0.5) * 20, 
                     vx: v_pixel_base, base_vx: v_pixel_base, type: 'neutral', lastCavityIndex: -1 
                     });
                 }
             }
           }
 
           if (running) {
             particlesRef.current.forEach((p, i) => {
               // Interaction loop
               for (let idx = 0; idx < N; idx++) {
                   const cavX = cavityPositions[idx];
                   if (p.x >= cavX && p.lastCavityIndex < idx) {
                       const phase = frameRef.current * omega_visual;
                       const sinVal = Math.sin(phase);
                       const gainDB = inputs.G || 8;
                       const gainLinear = Math.pow(10, gainDB / 20); 
                       
                       const base_mod = (safe_Vi / (2 * Vo_real)) * 3.0; 
                       const visual_scale = 8.0; 
                       
                       let currentMod = base_mod * Math.pow(gainLinear, idx) * visual_scale;
                       if (currentMod > 0.95) currentMod = 0.95; 
 
                       let modFactor = 1 + currentMod * sinVal;
                       // Clamp speed reduction
                       if (modFactor < 0.1) modFactor = 0.1; 
 
                       p.vx = p.base_vx * modFactor;
                       p.lastCavityIndex = idx; 
                       
                       if (sinVal > 0.1) p.type = 'fast'; else if (sinVal < -0.1) p.type = 'slow'; else p.type = 'neutral';
                   }
               }
 
               // Cleanup after catcher
               if (p.x > catcherX + 20) {
                  p.vx = p.vx * 0.9 + p.base_vx * 0.1;
                  p.type = 'neutral';
               }
 
               p.x += p.vx * timeScale;
               
               if (p.x > totalLength + 50) {
                 particlesRef.current[i] = { x: 0 - Math.random() * 5, y: cy + (Math.random() - 0.5) * 20, vx: v_pixel_base, base_vx: v_pixel_base, type: 'neutral', lastCavityIndex: -1 };
               }
             });
           }
 
           drawMetal(0, cy - 55, totalLength, 15, 'steel');
           drawMetal(0, cy + 40, totalLength, 15, 'steel');
           cavityPositions.forEach((cavX, idx) => {
             let label = idx === 0 ? "BUNCHER" : (idx === N - 1 ? "CATCHER" : `INT ${idx}`);
             drawCavity(cavX, cy, 40, 60, label);
           });
           ctx.fillStyle = '#334155'; ctx.fillRect(collectorX, cy - 40, 40, 80);
           ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('COLLECTOR', collectorX, cy);
           
           
 
           particlesRef.current.forEach(p => {
              let color = '#60a5fa'; 
              if (p.type === 'fast') color = '#f87171'; // Red
              if (p.type === 'slow') color = '#ffffff'; // White for stark contrast
              drawElectron(p.x, p.y, 2.0, color);
           });
        }
        
        // === REFLEX KLYSTRON ===
        else if (deviceId === 'reflex') {
            const maxParticles = Math.floor(600 * particleDensity);
          
            // Constants for visual modulation
            const omega_visual = 0.2;
            
            if (running && particlesRef.current.length < maxParticles) {
              particlesRef.current.push({ 
                x: 100, 
                y: cy,
                vx: 5 + (inputs.Vo || 600) * 0.005,
                base_vx: 5 + (inputs.Vo || 600) * 0.005, // Store base velocity
                phase: Math.random() * Math.PI * 2,
                type: 'neutral',
                modulated: false
              });
            }
            const cavX = width * 0.35;
            const repX = width * 0.75;
            const repField = (inputs.Vr || 350) * 0.003;
  
            if (running) {
              particlesRef.current.forEach((p, i) => {
                // Apply modulation at the cavity gap (only on the way forward)
                if (p.vx > 0 && Math.abs(p.x - cavX) < 10 && !p.modulated) {
                   const phase = frameRef.current * omega_visual;
                   const sinVal = Math.sin(phase);
                   
                   // Apply velocity modulation
                   const modDepth = 0.3; 
                   p.vx = p.vx * (1 + modDepth * sinVal);
                   p.modulated = true;
  
                   if (sinVal > 0.1) p.type = 'fast'; 
                   else if (sinVal < -0.1) p.type = 'slow'; 
                   else p.type = 'neutral';
                }
  
                // Repeller Field Logic (Physics)
                if (p.x > cavX) {
                  // Electrons slow down as they approach repeller
                  p.vx -= repField * timeScale;
                }
                
                p.x += p.vx * timeScale;
                
                // Remove if it returns past the start or hits boundaries
                if (p.x < 80 && p.vx < 0) {
                  particlesRef.current[i] = { 
                    x: 100, 
                    y: cy, 
                    vx: 5 + (inputs.Vo || 600) * 0.005,
                    base_vx: 5 + (inputs.Vo || 600) * 0.005,
                    phase: Math.random() * Math.PI * 2,
                    type: 'neutral',
                    modulated: false
                  };
                }
              });
            }
  
            // Draw
            drawMetal(0, cy - 50, width, 15, 'steel');
            drawMetal(0, cy + 35, width, 15, 'steel');
            drawCavity(cavX, cy, 50, 70, 'RESONATOR');
            
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(repX, cy, 60, 1.2 * Math.PI, 1.8 * Math.PI);
            ctx.lineTo(repX, cy);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('REPELLER', repX, cy - 70);
  
            particlesRef.current.forEach(p => {
              let color = '#60a5fa'; // Default Blue
              if (p.type === 'fast') color = '#f87171'; // Red
              if (p.type === 'slow') color = '#cbd5e1'; // Dimmed White
              
              const r = (p.vx < 0 && p.x < cavX + 50) ? 3.5 : 3.0;
              drawElectron(p.x, p.y, r, color);
            });
        }

        // === TWT ===
        else if (deviceId === 'twt') {
            const helixStart = 80;
            const helixEnd = width - 80;
            const totalLen = helixEnd - helixStart;
            
            const attenStart = helixStart + (totalLen * 0.45); 
            const attenEnd = attenStart + 40; 
            
            const Vo = inputs.Vo || 3; 
            const initialVelocity = Math.sqrt(Vo) * 2.5; 
  
            const useAttenuator = (inputs.atten !== undefined ? inputs.atten > 0.5 : true);
  
            const Vi = inputs.Vi || 10;
            const tightness = (Vi / 20) * 1.0; 
  
            if (running) {
               const twtMaxParticles = 4500; 
               if (particlesRef.current.length < twtMaxParticles) {
                  const injectionCount = 8; 
                  for(let j=0; j<injectionCount; j++){
                      particlesRef.current.push({ 
                          x: 20 - Math.random(), 
                          y: cy + (Math.random() - 0.5) * 4, 
                          vx: initialVelocity,      
                          type: 'blue' 
                      });
                  }
               }
            }
  
            if (running) {
               particlesRef.current.forEach((p, i) => {
                  
                  if (p.x < helixStart) {
                      p.vx = initialVelocity; 
                      p.type = 'blue';
                  }
                  else if (p.x >= helixStart && p.x < helixEnd) {
                      
                      const inAttenZone = (p.x >= attenStart && p.x <= attenEnd);
                      
                      const k = 0.15; 
                      const w = 0.25; 
                      const wavePhase = (p.x * k) - (frameRef.current * w);
                      
                      let amplitude = 0;
                      
                      if (useAttenuator && inAttenZone) {
                          amplitude = 0; 
                      } else {
                          let progress = (p.x - helixStart) / totalLen;
                          
                          if (useAttenuator && p.x > attenEnd) {
                               progress = (p.x - attenEnd) / (helixEnd - attenEnd);
                               amplitude = 2 + Math.exp(progress * 2.5);
                          } else {
                               amplitude = 1 + Math.exp(progress * 3.0);
                          }
                      }
  
                      const rf_field = Math.sin(wavePhase);
                      
                      if (amplitude > 0) {
                          let force = rf_field * amplitude * tightness;
                          if (force > 0) force *= 2.0; 
                          else force *= 1.2;
  
                          p.vx = initialVelocity + (force * 2);
                      }
  
                      const speedRatio = p.vx / initialVelocity;
  
                      if (speedRatio < 0.96) p.type = 'white'; 
                      else if (speedRatio > 1.05) p.type = 'red';   
                      else p.type = 'blue';
                  } 
  
                  p.x += p.vx * timeScale;
                  
                  if (p.x > width + 50) {
                     particlesRef.current[i] = { 
                        x: 20, y: cy + (Math.random() - 0.5) * 4, 
                        vx: initialVelocity, type: 'blue'
                     };
                  }
               });
            }
  
            ctx.fillStyle = '#60a5fa'; ctx.fillRect(10, cy - 15, 30, 30);
            ctx.fillStyle = '#fff'; ctx.fillText("GUN", 15, cy - 20);
  
            const magSpace = 25;
            for(let m = helixStart - 10; m < helixEnd + 10; m+=magSpace) {
               const isN = Math.floor((m/magSpace)%2)===0;
               ctx.fillStyle = isN ? '#ef4444' : '#3b82f6'; 
               ctx.fillRect(m, cy - 45, magSpace-2, 10); 
               ctx.fillRect(m, cy + 35, magSpace-2, 10); 
            }
  
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#f59e0b'; 
            ctx.beginPath();
            const animP = frameRef.current * 0.25; 
            for (let x = helixStart; x <= helixEnd; x += 2) {
               let amp = 0;
               const inAttenZone = (x >= attenStart && x <= attenEnd);
  
               if (useAttenuator && inAttenZone) {
                   amp = 0; 
               } else {
                   let progress = (x - helixStart) / totalLen;
                   if (useAttenuator && x > attenEnd) {
                       progress = (x - attenEnd) / (helixEnd - attenEnd);
                       amp = 5 + Math.exp(progress * 2.5) * 2;
                   } else {
                       amp = 5 + Math.exp(progress * 2.8) * 3;
                   }
               }
  
               const y = cy + Math.sin((x * 0.15) - animP) * amp;
               
               if (useAttenuator && (Math.abs(x - attenStart) < 2 || Math.abs(x - attenEnd) < 2)) {
                  ctx.moveTo(x, y);
               } else if (x===helixStart) {
                  ctx.moveTo(x, y);
               } else {
                  ctx.lineTo(x, y);
               }
            }
            ctx.stroke();
  
            if (useAttenuator) {
                ctx.fillStyle = 'rgba(50, 50, 50, 0.9)'; 
                ctx.fillRect(attenStart, cy - 12, 40, 24);
                ctx.fillStyle = '#fff'; ctx.font = "10px monospace"; 
                ctx.fillText("ATTEN", attenStart + 2, cy - 15);
            }
  
            ctx.fillStyle = '#334155'; ctx.fillRect(width - 60, cy - 25, 40, 50);
  
            particlesRef.current.forEach(p => {
                let color = '#3b82f6'; let r = 2.0;
                if (p.type === 'white') { 
                    color = '#ffffff'; r = 3.5; ctx.shadowColor = 'white'; ctx.shadowBlur = 8;
                } else if (p.type === 'red') { 
                    color = '#ef4444'; r = 2.2; ctx.shadowBlur = 0;
                } else {
                    ctx.shadowBlur = 0;
                }
                if(p.x > 0 && p.x < width) {
                    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
                }
                ctx.shadowBlur = 0; 
            });
        }

        // === O-BWO ===
        else if (deviceId === 'obwo') {
             const structStart = 100;
             const structEnd = width - 100;
             
             const V0 = inputs.Vo || 5; 
             const base_v = Math.sqrt(V0) * 2.5; 
  
             if (running && particlesRef.current.length < 3500 * particleDensity) {
                 const injectionCount = Math.ceil(particleDensity * 4);
                 for(let j=0; j<injectionCount; j++) {
                     particlesRef.current.push({ 
                         x: 50, 
                         y: cy + (Math.random()-0.5) * 10, 
                         vx: base_v,
                         base_vx: base_v, 
                         type: 'blue' 
                     });
                 }
             }
  
             if (running) {
                 particlesRef.current.forEach((p, i) => {
                     if (p.x > structStart && p.x < structEnd) {
                         const phase = (p.x * 0.15) - (frameRef.current * 0.2); 
                         const rf_field = Math.sin(phase);
                         const waveAmp = 1.0 - ((p.x - structStart) / (structEnd - structStart)) * 0.6;
  
                         if (rf_field * waveAmp > 0.15) {
                            p.vx = p.base_vx * 0.7; 
                            p.type = 'white';
                         } else if (rf_field * waveAmp < -0.15) {
                            p.vx = p.base_vx * 1.8; 
                            p.type = 'red';
                         } else {
                            p.vx = p.base_vx;
                            p.type = 'blue';
                         }
                     } else {
                         p.vx = p.base_vx;
                         p.type = 'blue';
                     }
  
                     p.x += p.vx * timeScale;
                     
                     if (p.x > width + 50) {
                        particlesRef.current[i] = { 
                            x: 50, 
                            y: cy + (Math.random()-0.5) * 10, 
                            vx: base_v, 
                            base_vx: base_v, 
                            type: 'blue' 
                        };
                     }
                 });
             }
  
             ctx.lineWidth = 4;
             ctx.strokeStyle = '#d97706'; 
             ctx.beginPath();
             const pitch = 30; 
             const h = 40;     
             
             for (let x = structStart; x <= structEnd; x += pitch) {
                 ctx.moveTo(x, cy - h); 
                 ctx.lineTo(x, cy - 10);
                 ctx.moveTo(x + pitch/2, cy + h); 
                 ctx.lineTo(x + pitch/2, cy + 10);
             }
             ctx.stroke();
             
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
             ctx.lineWidth = 1;
             ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
  
             ctx.fillStyle = '#60a5fa'; 
             ctx.fillRect(20, cy-20, 30, 40); 
             ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.fillText("GUN", 25, cy-25);
  
             ctx.fillStyle = '#334155'; 
             ctx.fillRect(width-50, cy-30, 40, 60); 
             ctx.fillStyle='#94a3b8'; ctx.fillText("COLLECTOR", width-100, cy-35);
  
             ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 4;
             ctx.beginPath(); 
             ctx.moveTo(structStart, cy - h); 
             ctx.lineTo(structStart - 20, cy - h - 30); 
             ctx.stroke();
             ctx.fillStyle = '#ec4899'; ctx.font='bold 12px sans-serif'; 
             ctx.fillText("RF OUT", structStart - 40, cy - h - 35);
  
             particlesRef.current.forEach(p => {
                 let color = '#60a5fa'; // Blue
                 let r = 2.5;
  
                 if (p.type === 'white') { 
                     color = '#ffffff'; // Bunch
                     r = 3.5; 
                 } 
                 else if (p.type === 'red') { 
                     color = '#ef4444'; // Accelerated
                     r = 2.0; 
                 } 
                 
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                 ctx.fillStyle = color;
                 
                 if (p.type === 'white') {
                    ctx.shadowColor = 'white';
                    ctx.shadowBlur = 5;
                 } else {
                    ctx.shadowBlur = 0;
                 }
                 
                 ctx.fill();
                 ctx.shadowBlur = 0; 
             });
        }

        // === MAGNETRON ===
        else if (deviceId === 'magnetron') {
            const maxParticles = Math.floor(3500 * particleDensity);
            
            const scale = 3.5; 
            const ra = (inputs.ra || 6) * scale;   
            const rb = (inputs.rb || 25) * scale;  
            const N = inputs.N || 8; 
            const tuneParam = inputs.tune || 0;    
            
            const Vo = inputs.Vo || 26; 
            const Bo = inputs.Bo || 336; 
            
            const omega_rot = (Bo / 800) * 0.25; 
            
            let hubRadius = ra + (Vo * 2.5) - (Bo * 0.12);
            if (hubRadius > rb - 15) hubRadius = rb - 15;
            if (hubRadius < ra + 5) hubRadius = ra + 5;
            
            const extendSpokes = Vo > 12; 
  
            if (running && particlesRef.current.length < maxParticles) {
                const injectionCount = Math.ceil(particleDensity * 6);
                for(let j=0; j<injectionCount; j++) {
                    particlesRef.current.push({
                        r: ra + Math.random() * 4, 
                        theta: Math.random() * 2 * Math.PI,
                    });
                }
            }
  
            if (running) {
                particlesRef.current.forEach((p, i) => {
                    p.theta += omega_rot * timeScale;
                    
                    const sectorSize = (2 * Math.PI) / N;
                    const relativeAngle = (p.theta % sectorSize + sectorSize) % sectorSize;
                    const isSpoke = relativeAngle < (sectorSize * 0.3);
  
                    if (isSpoke && extendSpokes) {
                        p.r += 1.2 * timeScale * (Vo/30); 
                    } else {
                        if (p.r > hubRadius) p.r -= 2.5 * timeScale; 
                        else p.r += (Math.random() - 0.4) * timeScale;
                    }
  
                    if (p.r < ra) p.r = ra;
                    if (p.r > rb) {
                        particlesRef.current[i] = {
                            r: ra + Math.random(),
                            theta: Math.random() * 2 * Math.PI
                        };
                    }
                });
            }
  
            const outerShell = rb + 50;
            ctx.fillStyle = '#b45309'; 
            ctx.beginPath();
            ctx.arc(cx, cy, outerShell, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; ctx.stroke();
  
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx, cy, rb, 0, Math.PI * 2);
            ctx.fill();
  
            for (let i = 0; i < N; i++) {
                const ang = (i / N) * 2 * Math.PI;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(ang);
                
                const holeRadius = 18;
                const holeDist = rb + 22; 
                
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(holeDist, 0, holeRadius, 0, Math.PI*2);
                ctx.fill();
                
                ctx.fillRect(rb - 2, -5, 24, 10);
                
                ctx.globalCompositeOperation = 'source-over';
                
                ctx.fillStyle = '#1e1e1e';
                ctx.beginPath();
                ctx.arc(holeDist, 0, holeRadius, 0, Math.PI*2);
                ctx.fill();
                
                ctx.fillRect(rb - 2, -5, 24, 10);
  
                if (tuneParam > 0) {
                    const maxPinR = holeRadius - 2;
                    const currentPinR = maxPinR * (tuneParam / 100);
                    
                    ctx.beginPath();
                    ctx.arc(holeDist, 0, currentPinR, 0, Math.PI*2);
                    
                    const grad = ctx.createRadialGradient(holeDist - 2, -2, 1, holeDist, 0, currentPinR);
                    grad.addColorStop(0, '#fcd34d'); 
                    grad.addColorStop(0.5, '#fbbf24'); 
                    grad.addColorStop(1, '#b45309'); 
                    
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = '#78350f';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
  
                ctx.restore();
            }
  
            ctx.fillStyle = '#fbbf24'; 
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
            ctx.beginPath();
            ctx.arc(cx, cy, ra, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx, cy, ra*0.3, 0, Math.PI*2); ctx.fill();
  
            particlesRef.current.forEach(p => {
                ctx.fillStyle = '#60a5fa'; 
                ctx.beginPath();
                ctx.arc(cx + Math.cos(p.theta) * p.r, cy + Math.sin(p.theta) * p.r, 2, 0, Math.PI*2);
                ctx.fill();
            });
  
            if (tuneParam > 0) {
                 ctx.fillStyle = '#fbbf24';
                 ctx.font = '11px monospace';
                 ctx.textAlign = 'center';
                 ctx.fillText(`TUNING INSERTION: ${tuneParam}%`, cx, cy + rb + 80);
            }
        }

        // === CARCINOTRON ===
        else if (deviceId === 'carcinotron') {
             const startX = 100;
             const endX = width - 100;
             const soleY = cy + 60; 
             const anodeY = cy - 60; 
  
             const gap = inputs.d || 5;
             const E_field_val = inputs.Vo / gap; 
             let driftV = (E_field_val / (inputs.Bo || 350)) * 180; 
             if (driftV < 2) driftV = 2; 
  
             const maxParticles = 7000; 
             
             if (running && particlesRef.current.length < maxParticles) {
                 const injectionRate = 30; 
                 for(let j=0; j<injectionRate; j++){
                     particlesRef.current.push({ 
                         x: 50 + Math.random() * 15, 
                         y: soleY - 15 - Math.random() * 25, 
                         type: 'blue',
                         baseY: soleY - 25 
                     });
                 }
             }
  
             if (running) {
                 const bunchingFactor = 2.5; 
  
                 particlesRef.current.forEach((p, i) => {
                     const phase = (p.x * 0.1) - (frameRef.current * 0.3);
                     const rf_field = Math.sin(phase);
  
                     p.x += (driftV + (rf_field * bunchingFactor)) * timeScale;
  
                     let targetY = p.baseY + (Math.sin(phase + Math.PI/2) * 20); 
                     
                     if (p.x > startX) {
                         if (rf_field < -0.1) {
                             p.baseY -= 0.6 * timeScale; 
                             p.type = 'white'; 
                         } else {
                             p.baseY += 0.3 * timeScale; 
                             p.type = 'red'; 
                         }
                     }
  
                     p.y += (targetY - p.y) * 0.2;
  
                     if (p.y <= anodeY + 5) {
                         p.y = anodeY + 5;
                         p.type = 'absorbed'; 
                     }
                     if (p.y >= soleY - 5) p.y = soleY - 5;
  
                     if (p.x > width + 20 || p.type === 'absorbed') {
                         particlesRef.current[i] = { 
                             x: 50, 
                             y: soleY - 15 - Math.random() * 25, 
                             type: 'blue',
                             baseY: soleY - 25
                         };
                     }
                 });
             }
  
             ctx.fillStyle = '#1e293b'; ctx.fillRect(startX, soleY, endX - startX, 15);
             ctx.fillStyle = '#94a3b8'; ctx.fillText("SOLE (-)", width/2, soleY + 30);
  
             ctx.fillStyle = '#b45309'; 
             ctx.fillRect(startX, anodeY - 20, endX - startX, 20); 
             const pitch = 20;
             for(let x = startX; x < endX; x += pitch) { 
                 ctx.fillStyle = '#d97706'; ctx.fillRect(x, anodeY, 10, 20); 
             }
             ctx.fillStyle = '#fbbf24'; ctx.fillText("ANODE (+)", width/2, anodeY - 30);
  
             ctx.fillStyle = '#60a5fa'; 
             ctx.beginPath(); ctx.moveTo(30, soleY); ctx.lineTo(startX, soleY-10); ctx.lineTo(startX, soleY); ctx.fill();
  
             ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 4; 
             ctx.beginPath(); ctx.moveTo(startX, anodeY); ctx.lineTo(startX - 30, anodeY - 30); ctx.stroke();
             ctx.fillStyle = '#ec4899'; ctx.fillText("RF OUT", startX - 60, anodeY - 40);
  
             ctx.fillStyle = '#475569'; ctx.fillRect(endX, soleY - 60, 30, 70);
  
             particlesRef.current.forEach(p => {
                 let color = '#3b82f6'; 
                 let r = 2; 
                 if (p.type === 'white') { color = '#ffffff'; r = 2.5; } 
                 else if (p.type === 'red') { color = '#ef4444'; r = 2; } 
                 
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                 ctx.fillStyle = color;
                 ctx.fill();
             });
        }

      // === GUNN DIODE (UPDATED) === 
      else if (deviceId === 'gunn') {
        particlesRef.current ||= [];
        const L = Number(inputs.L || 10);
        const V = Number(inputs.V || 12);
        const vd = Number(inputs.vd || 1e7);
        
        const L_vis = 300; 
        const startX = cx - L_vis / 2;
        
        const E = V / (L * 1e-4);
        const driftVel = ((vd / 1e7) * 8) * 0.4; 
        const fieldStrength = Math.min(1, (E - 3200) / 5000);
        const isGunn = E > 3000; // Threshold ~ 3000 V/cm (RWH Theory)
        
        // --- Structure Drawing (GaAs Bar) ---
        drawMetal(startX - 30, cy - 40, 30, 80, 'gold');
        const regionColor = isGunn ? '#059669' : '#047857'; 
        drawLayer(startX, cy - 40, L_vis, 80, regionColor, 'n- GaAs', 'Active Region');
        drawMetal(startX + L_vis, cy - 40, 30, 80, 'gold');
        drawMetal(startX - 30, cy + 45, L_vis + 60, 20, 'copper');
        drawLabel('Heat Sink', cx, cy + 60, '#fbbf24');

        // --- Domain Logic ---
        if (running && isGunn && Math.random() < 0.03 * timeScale) {
          const hasDomain = particlesRef.current.some(p => p.type === 'domain');
          if (!hasDomain) {
              particlesRef.current.push({
                x: startX + 10, y: cy, size: 60, vx: 3, type: 'domain'
              });
          }
        }
        if (running) {
          particlesRef.current.forEach((p, i) => {
            p.x += p.vx * timeScale;
            if (p.x > startX + L_vis - 10) { particlesRef.current.splice(i, 1); }
          });
        }
        particlesRef.current.forEach(p => {
            const grad = ctx.createLinearGradient(p.x - 20, 0, p.x + 20, 0);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad; ctx.fillRect(p.x - 20, cy - 38, 40, 76);
            drawLabel('High E-Field', p.x, cy - 50, '#fff');
        });
      }

      // === TUNNEL DIODE (MESA STRUCTURE) === 
      else if (deviceId === 'tunnel') {
        particlesRef.current ||= [];
        const maxParticles = 300;
        const voltage = inputs.Vbias || inputs.V || 0;
        const isConducting = voltage > 0; 

        // --- MESA STRUCTURE DRAWING ---
        drawMetal(cx - 80, cy + 60, 160, 20, 'gold'); 
        drawLabel('Anode', cx, cy + 75, '#000');
        drawMetal(cx - 90, cy - 60, 20, 140, 'steel');
        drawMetal(cx + 70, cy - 60, 20, 140, 'steel');
        drawTrapezoid(cx - 60, cy, 60, 120, 60, '#991b1b'); 
        drawLabel('p++ Ge/GaAs', cx, cy + 40, 'rgba(255,255,255,0.8)');
        ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI, true); ctx.fillStyle = '#cbd5e1'; ctx.fill();
        drawLabel('n++ Dot', cx, cy - 5, '#000');
        ctx.beginPath(); ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy);
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy - 60); ctx.stroke();
        drawMetal(cx - 80, cy - 80, 160, 20, 'gold'); 
        drawLabel('Cathode', cx, cy - 65, '#000');

        // --- Tunneling Particles ---
        if (running && particlesRef.current.length < maxParticles && isConducting) {
            if (Math.random() < 0.2) {
                particlesRef.current.push({
                    x: cx + (Math.random()-0.5)*20, y: cy - 5, vx: (Math.random()-0.5), vy: 2 + Math.random(), life: 1.0
                });
            }
        }
        if (running) {
          particlesRef.current.forEach((p, i) => {
             p.y += p.vy * timeScale; p.x += p.vx * timeScale; p.life -= 0.02;
             if (p.life <= 0 || p.y > cy + 60) particlesRef.current.splice(i, 1);
          });
        }
        particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.life; drawElectron(p.x, p.y, 2, '#60a5fa'); ctx.globalAlpha = 1.0;
        });
      }
      
      // === IMPATT DIODE (PULSED AVALANCHE) === 
      else if (deviceId === 'impatt') {
        particlesRef.current ||= [];
        const totalW = 320;
        const startX = cx - totalW/2;
        const w_p_plus = 40; const w_p = 60; const w_n = 160; const w_n_plus = 60;

        drawLayer(startX, cy - 60, w_p_plus, 120, '#7f1d1d', 'p+', 'Contact');
        drawLayer(startX + w_p_plus, cy - 60, w_p, 120, '#b91c1c', 'p', 'Avalanche'); 
        drawLayer(startX + w_p_plus + w_p, cy - 60, w_n, 120, '#d97706', 'n', 'Drift Region');
        drawLayer(startX + w_p_plus + w_p + w_n, cy - 60, w_n_plus, 120, '#1e3a8a', 'n+', 'Contact');
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; ctx.fillRect(startX + w_p_plus, cy - 60, w_p, 120); 
        drawLabel('High E-Field', startX + w_p_plus + w_p/2, cy - 75, '#fbbf24');

        const isBreakdown = (inputs.Vd || 90) > 80;
        const freq = 0.05; 
        const cycle = Math.sin(frameRef.current * freq);
        const isPeak = cycle > 0.8; 

        if (running && isBreakdown && isPeak) {
          const junctionX = startX + w_p_plus + w_p; 
          for(let k=0; k<3; k++) {
              particlesRef.current.push({ x: junctionX - Math.random()*10, y: cy + (Math.random()-0.5)*40, vx: -2.5, type: 'hole', life: 100 });
              particlesRef.current.push({ x: junctionX + Math.random()*10, y: cy + (Math.random()-0.5)*40, vx: 3.5, type: 'electron', life: 100 });
          }
        }
        if (running) {
          particlesRef.current.forEach((p, i) => {
            p.x += p.vx * timeScale;
            if (p.type === 'hole' && p.x < startX) particlesRef.current.splice(i, 1);
            if (p.type === 'electron' && p.x > startX + totalW) particlesRef.current.splice(i, 1);
          });
        }
        particlesRef.current.forEach(p => {
          const color = p.type === 'electron' ? '#60a5fa' : '#ef4444'; 
          drawElectron(p.x, p.y, 3, color);
        });
        ctx.fillStyle = isPeak ? '#4ade80' : '#334155';
        ctx.beginPath(); ctx.arc(cx, cy + 80, 5, 0, Math.PI*2); ctx.fill();
        drawLabel(isPeak ? "GENERATION" : "WAITING", cx, cy + 95, isPeak ? '#4ade80' : '#94a3b8');
      }
      
      // === TRAPATT DIODE === 
      else if (deviceId === 'trapatt') {
        particlesRef.current ||= [];
        const w_p = 50; const w_n = 200; const w_n_plus = 50;
        const totalW = w_p + w_n + w_n_plus;
        const startX = cx - totalW/2;
        
        drawLayer(startX, cy - 50, w_p, 100, '#7f1d1d', 'p+');
        drawLayer(startX + w_p, cy - 50, w_n, 100, '#c2410c', 'n (Drift)', 'Plasma Zone');
        drawLayer(startX + w_p + w_n, cy - 50, w_n_plus, 100, '#172554', 'n+');

        if (running && particlesRef.current.length < 100) {
             particlesRef.current.push({
                x: startX + w_p + Math.random() * 20, y: cy + (Math.random()-0.5)*60, vx: 1.0, state: 'filling'
            });
        }
        if (running) {
          particlesRef.current.forEach((p, i) => {
            if (p.state === 'filling') {
                p.x += p.vx * timeScale;
                if (p.x > startX + w_p + w_n - 10) { p.state = 'extracting'; p.vx = 8.0; }
            } else { p.x += p.vx * timeScale; }
            if (p.x > startX + totalW) { p.x = startX + w_p; p.vx = 1.0; p.state = 'filling'; }
          });
        }
        particlesRef.current.forEach(p => {
          ctx.shadowBlur = p.state === 'filling' ? 10 : 2;
          ctx.shadowColor = '#fbbf24'; 
          const color = p.state === 'filling' ? '#ffffff' : '#60a5fa';
          drawElectron(p.x, p.y, 4, color);
        });
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [deviceId, running, inputs, fidelity, timeScale, particleDensity]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
