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
              if (p.type === 'slow') color = '#e2e8f0'; // White for slow
              drawElectron(p.x, p.y, 3, color);
          });
      }
      // === MULTI-CAVITY KLYSTRON (UPDATED VISUALS) ===
      else if (deviceId === 'klystronMulti') {
          // --- 1. Physics Calculations ---
          const Vo_kv = inputs.Vo || 15;
          const Vo_real = Vo_kv * 1000;
          const v0_real = 5.93e5 * Math.sqrt(Vo_real);
          const f_GHz = inputs.f || 3;
          const omega_real = 2 * Math.PI * f_GHz * 1e9;
          const d_mm = inputs.d || 3; 
          const d_meters = d_mm / 1000;
          const Vi_real = inputs.Vi || 10; 

          // Coupling
          const transit_angle_rad = (omega_real * d_meters) / v0_real;
          let beta = 1.0;
          const half_theta = transit_angle_rad / 2;
          if (Math.abs(half_theta) > 0.0001) beta = Math.sin(half_theta) / half_theta;

          // Gain Setup
          const gainDB_stage = inputs.G || 15;
          const gainLinear_stage = Math.pow(10, gainDB_stage / 20); 
          
          // Layout
          const N = Math.floor(inputs.N || 4);
          const L_stage_cm = inputs.L || 5; 
          
          let px_per_cm = 50; 
          const buncherX_start = width * 0.15;
          const total_L_cm = (N - 1) * L_stage_cm;
          const available_width = width - buncherX_start - 100;
          if (total_L_cm * px_per_cm > available_width) px_per_cm = available_width / total_L_cm;
          if (px_per_cm < 20) px_per_cm = 20;

          const cavityPositions = [];
          for (let i = 0; i < N; i++) cavityPositions.push(buncherX_start + i * (L_stage_cm * px_per_cm));
          
          const catcherX = cavityPositions[N - 1]; 
          const collectorX = catcherX + 80;
          const totalLength = collectorX + 60;
          
          const v_pixel_base = 4.0 * Math.pow(Vo_kv/10, 0.4); 
          const omega_visual = 0.15 * f_GHz; 

          // --- 2. Particle Logic ---
         // --- 2. Particle Logic (Dynamic Density) ---
          if (running) {
             // معادلة الكثافة:
             // كل ما التيار يزيد، نزود الحد الأقصى وسرعة الضخ
             // بنعمل Normalization على 100mA كقيمة متوسطة
             const current_Io = inputs.Io || 100;
             
             // Scale Factor: 
             // لو التيار 500mA الكثافة تزيد 5 أضعاف
             // بس بنحط سقف (Math.min) عشان المتصفح ما يهنجش لو التيار عالي جداً
             const densityFactor = Math.min(8.0, current_Io / 50.0); 
             
             const multiMaxParticles = 1000 * densityFactor; 
             
             if (particlesRef.current.length < multiMaxParticles) {
                 // Injection Rate:
                 // لازم نضخ عدد أكبر في كل فريم عشان نحافظ على التدفق العالي
                 const injectionCount = Math.ceil(2 * densityFactor);
                 
                 for(let j=0; j<injectionCount; j++){
                     particlesRef.current.push({ 
                       x: 0 - Math.random() * 10, 
                       y: cy + (Math.random() - 0.5) * 20, // Spread Y slightly with current logic if needed
                       vx: v_pixel_base, 
                       base_vx: v_pixel_base, 
                       type: 'neutral', 
                       lastCavityIndex: -1 
                     });
                 }
             }
          }

          if (running) {
             particlesRef.current.forEach((p, i) => {
               for (let idx = 0; idx < N; idx++) {
                   const cavX = cavityPositions[idx];
                   
                   // Interaction Zone
                   if (p.x >= cavX && p.x < cavX + 20 && p.lastCavityIndex < idx) {
                       const phase = frameRef.current * omega_visual;
                       // Add slight phase delay per stage for realism
                       const local_phase = phase - (idx * Math.PI/2);
                       const sinVal = Math.sin(local_phase);
                       
                       // --- NEW LOGIC START ---
                       // Calculate Real Physics Voltage at this stage
                       let current_RF_Voltage = Vi_real * Math.pow(gainLinear_stage, idx);
                       
                       // Physics Saturation Limit (Cannot exceed ~1.2x Beam Voltage)
                       const saturation_limit = 1.2 * Vo_real;
                       if (current_RF_Voltage > saturation_limit) current_RF_Voltage = saturation_limit;
                       
                       // Physical Modulation Depth (Small number)
                       let mod_depth = (beta * current_RF_Voltage) / (2 * Vo_real);
                       
                       // **VISUAL MAGIC HERE:**
                       // Use a very high sensitivity factor to boost small signals (Input)
                       // Use tanh to softly clamp large signals (Output) so they don't look crazy
                       const visual_sensitivity = 800.0; // Increased massively to show input effect
                       
                       // This curve makes 0.001 look like 0.2, but makes 1.0 look like 0.8
                       let visual_impact = Math.tanh(mod_depth * visual_sensitivity); 
                       
                       // Apply to velocity (Max visual change limited to +/- 40%)
                       let delta_v = visual_impact * sinVal * 0.4;
                       
                       // Space Charge Debunching simulation (dampen slightly if not reinforced)
                       if (idx > 0 && Math.abs(sinVal) < 0.1) delta_v *= 0.9;

                       // Apply
                       let new_vx = p.vx + (p.base_vx * delta_v);
                       
                       // Hard Clamps for simulation stability
                       if (new_vx < p.base_vx * 0.2) new_vx = p.base_vx * 0.2;
                       if (new_vx > p.base_vx * 3.0) new_vx = p.base_vx * 3.0;

                       p.vx = new_vx;
                       p.lastCavityIndex = idx;
                       // --- NEW LOGIC END ---

                       // Color Logic
                       const speed_ratio = p.vx / p.base_vx;
                       if (speed_ratio > 1.05) p.type = 'fast'; 
                       else if (speed_ratio < 0.95) p.type = 'slow'; 
                       else p.type = 'neutral';
                   }
               }

               // Catcher Deceleration
               if (p.x > catcherX + 10 && p.x < catcherX + 30) {
                   p.vx = p.vx * 0.95; 
               }

               p.x += p.vx * timeScale;
               
               if (p.x > totalLength + 50) {
                 particlesRef.current[i] = { 
                     x: 0 - Math.random() * 10, 
                     y: cy + (Math.random() - 0.5) * 20, 
                     vx: v_pixel_base, 
                     base_vx: v_pixel_base, 
                     type: 'neutral', 
                     lastCavityIndex: -1 
                 };
               }
             });
          }

          // --- 3. Drawing ---
          drawMetal(0, cy - 60, totalLength, 20, '#334155');
          drawMetal(0, cy + 40, totalLength, 20, '#334155');
          
          cavityPositions.forEach((cavX, idx) => {
             let label = idx === 0 ? "IN" : (idx === N - 1 ? "OUT" : `${idx}`);
             let color = idx === 0 ? "#60a5fa" : (idx === N - 1 ? "#f43f5e" : "#94a3b8");
             
             // Dynamic Glow based on signal strength
             // Using tanh again to map signal strength to opacity
             const stage_voltage = Vi_real * Math.pow(gainLinear_stage, idx);
             const glow_intensity = Math.tanh(stage_voltage / (Vo_real * 0.1)); // Glows when V_rf > 10% of V_beam
             
             if (glow_intensity > 0.1) {
                 ctx.shadowBlur = 15 * glow_intensity;
                 ctx.shadowColor = color;
             }
             
             drawCavity(cavX, cy, 40, 70, label, color);
             ctx.shadowBlur = 0;
          });

          ctx.fillStyle = '#1e293b'; ctx.fillRect(collectorX, cy - 50, 50, 100);
          ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('COLLECTOR', collectorX, cy);
          
          // Info HUD
          const total_gain_db = ((N-1) * gainDB_stage).toFixed(1);
          ctx.fillStyle = '#fff';
          ctx.font = '14px monospace';
          ctx.fillText(`Gain: ${total_gain_db} dB`, 20, 30);
          ctx.font = '12px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`(Visuals Enhanced for Visibility)`, 20, 45);

          particlesRef.current.forEach(p => {
             let color = '#60a5fa'; 
             if (p.type === 'fast') color = '#ef4444'; 
             if (p.type === 'slow') color = '#e2e8f0'; 
             drawElectron(p.x, p.y, 2.5, color);
          });
      }
        
   // === REFLEX KLYSTRON (FINAL: Physics + Dynamic Current Density) ===
      else if (deviceId === 'reflex') {
          // 1. Setup Constants
          const Vo = inputs.Vo || 300;
          const Vr = inputs.Vr || 150;
          const f_GHz = inputs.f || 9;
          
          // Physics: Oscillation Mode & Strength
          const e = 1.6e-19;
          const m = 9.11e-31;
          const v0_real = Math.sqrt(2 * e * Vo / m); 
          const L_m = (inputs.L || 2) / 1000;
          const T_round_trip = (4 * L_m * v0_real) / ((e/m)*(Vo + Vr));
          const N_cycles = T_round_trip * (f_GHz * 1e9);
          const ideal_N = Math.round(N_cycles - 0.75) + 0.75;
          const detuning = Math.abs(N_cycles - ideal_N);
          
          let oscillation_strength = Math.exp(-Math.pow(detuning/0.15, 2)); 
          if (oscillation_strength < 0.05) oscillation_strength = 0;

          // 2. Visualization Parameters
          const omega_visual = 0.25;
          const v_pixel_base = 5.0 * Math.pow(Vo/300, 0.5); 
          
          // Force Logic (Physics Corrected)
          // Low Vr -> Weak Force -> Long Distance
          const visual_distance_factor = 14000.0; // Tuning for screen width
          const repField = (Vo + Vr) / visual_distance_factor; 

          const cavX = width * 0.2; 
          const repellerX = width * 0.9; 
          const drift_length_px = repellerX - cavX;

          // --- 3. Particle System (DYNAMIC BEAM CURRENT) ---
          if (running) {
             // Reflex Io is usually 10-100mA. 
             // We normalize around 20mA.
             // If Io = 100mA -> Factor = 5.0 (Very Dense)
             // If Io = 10mA -> Factor = 0.5 (Sparse)
             const current_Io = inputs.Io || 20;
             const densityFactor = Math.min(6.0, current_Io / 20.0);
             
             const reflexMaxParticles = 800 * densityFactor; // Higher max for dense beam
             
             if (particlesRef.current.length < reflexMaxParticles) {
                 // Injection rate scales with density
                 const injectionCount = Math.ceil(2 * densityFactor);
                 
                 for (let j = 0; j < injectionCount; j++) {
                    particlesRef.current.push({ 
                      x: 20, 
                      y: cy + (Math.random() - 0.5) * 15,
                      vx: v_pixel_base,
                      base_vx: v_pixel_base,
                      modulated: false,
                      type: 'neutral'
                    });
                 }
             }
          }

          if (running) {
              particlesRef.current.forEach((p, i) => {
                const phase = frameRef.current * omega_visual;
                
                // A. Forward Pass
                if (p.vx > 0 && Math.abs(p.x - cavX) < 15 && !p.modulated) {
                    const rf_amp = 0.2 + (0.3 * oscillation_strength); 
                    const sinVal = Math.sin(phase);
                    
                    p.vx = p.vx * (1 + rf_amp * sinVal);
                    p.modulated = true;

                    if (sinVal > 0.1) p.type = 'fast'; 
                    else if (sinVal < -0.1) p.type = 'slow'; 
                    else p.type = 'neutral';
                }

                // B. Drift & Deceleration
                if (p.x > cavX) {
                    p.vx -= repField * timeScale;
                }
                
                p.x += p.vx * timeScale;

                // C. Boundaries
                if (p.x > repellerX) resetParticle(p, v_pixel_base); // Hit Repeller
                else if (p.x < 20 && p.vx < 0) resetParticle(p, v_pixel_base); // Returned
              });
          }

          function resetParticle(p, v_base) {
              p.x = 20;
              p.y = cy + (Math.random() - 0.5) * 15;
              p.vx = v_base;
              p.base_vx = v_base;
              p.type = 'neutral';
              p.modulated = false;
          }

          // 4. Drawing
          drawMetal(0, cy - 50, repellerX, 15, '#334155');
          drawMetal(0, cy + 35, repellerX, 15, '#334155');
          
          // Repeller Visuals
          ctx.fillStyle = '#ef4444'; 
          ctx.beginPath();
          ctx.arc(repellerX, cy, 60, 1.3 * Math.PI, 2.7 * Math.PI, true); 
          ctx.fill();
          
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.font = '10px monospace';
          
          // Drift Status Calculation
          // Theoretical stopping distance s = v^2 / 2a
          const stop_dist_ratio = (v_pixel_base*v_pixel_base) / (2 * repField * drift_length_px);
          let driftStatus = "NORMAL DRIFT";
          if (stop_dist_ratio > 0.95) driftStatus = "TOO LONG (Hit Repeller)";
          else if (stop_dist_ratio > 0.7) driftStatus = "LONG DRIFT (Low Vr)";
          else if (stop_dist_ratio < 0.4) driftStatus = "SHORT DRIFT (High Vr)";
          
          ctx.fillText(`REPELLER (-${Vr}V)`, repellerX - 15, cy);
          ctx.fillStyle = '#fca5a5';
          ctx.fillText(driftStatus, repellerX - 15, cy + 15);

          // Cavity Glow
          let cavityColor = '#475569'; 
          let glowSize = 0;
          if (oscillation_strength > 0.6) {
              cavityColor = '#f43f5e'; 
              glowSize = 25 * oscillation_strength;
          } else if (oscillation_strength > 0.2) {
              cavityColor = '#facc15'; 
              glowSize = 10;
          }

          if (glowSize > 0) {
              ctx.shadowBlur = 10 + glowSize;
              ctx.shadowColor = cavityColor;
          }
          drawCavity(cavX, cy, 50, 80, 'RESONATOR', cavityColor);
          ctx.shadowBlur = 0;

          // HUD
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'left';
          ctx.font = '14px monospace';
          if (oscillation_strength > 0.8) {
              ctx.fillStyle = "#4ade80";
              ctx.fillText(`OSCILLATING (Mode ${ideal_N - 0.75})`, 20, 30);
          } else {
              ctx.fillStyle = "#f87171";
              ctx.fillText("NO OSCILLATION", 20, 30);
          }

          // Particles
          particlesRef.current.forEach(p => {
              let color = '#60a5fa'; 
              let radius = 3;
              
              if (p.x > cavX) {
                 if (Math.abs(p.vx) < 0.5) { color = '#ffffff'; radius = 5; } // Turn-around flash
                 else if (p.vx < 0) { color = '#fbbf24'; } 
                 else if (p.type === 'fast') color = '#f87171';
                 else if (p.type === 'slow') color = '#93c5fd';
              }
              
              drawElectron(p.x, p.y, radius, color);
          });
      }
       // === TRAVELING WAVE TUBE (TWT - Continuous Interaction) ===
      else if (deviceId === 'twt') {
          // --- 1. Physics Engine ---
          const Vo_kv = inputs.Vo || 3;
          const Vo_real = Vo_kv * 1000;
          const Io_mA = inputs.Io || 50;
          
          // Beam Velocity: v = 0.593 * 10^6 * sqrt(Vo)
          const v0_real = 5.93e5 * Math.sqrt(Vo_real);
          
          const f_GHz = inputs.f || 10;
          const omega_real = 2 * Math.PI * f_GHz * 1e9;
          
          // Pierce Gain Parameter C (Approx 0.05 to 0.1 usually)
          // C = (Io * Z0 / 4Vo)^(1/3). Let's assume Z0 ~ 50 ohm scaling
          const Z0 = 50; 
          const C = Math.pow(( (Io_mA/1000) * Z0 ) / (4 * Vo_real), 1/3);
          
          const N_len = inputs.N || 40; // Length in wavelengths
          
          // Calculate Gain in dB: -9.54 + 47.3 * N * C
          const theoretical_gain_db = -9.54 + (47.3 * N_len * C);
          
          // --- 2. Visualization Parameters ---
          const helix_startX = 60;
          const helix_endX = width - 80;
          const helix_length_px = helix_endX - helix_startX;
          
          // Visual Speed
          const v_pixel_base = 4.0 * Math.pow(Vo_kv/3, 0.4); 
          const omega_visual = 0.25; 
          
          // Wave Number (k) for visualization
          // We want to fit N waves into the helix length
          const k_visual = (N_len * Math.PI * 2) / helix_length_px;

          // --- 3. Particle System (Dynamic Density) ---
          if (running) {
             const densityFactor = Math.min(6.0, Io_mA / 20.0);
             const twtMaxParticles = 1200 * densityFactor; // TWT needs HIGH density to show waves
             
             if (particlesRef.current.length < twtMaxParticles) {
                 const injectionCount = Math.ceil(3 * densityFactor);
                 for (let j = 0; j < injectionCount; j++) {
                    particlesRef.current.push({ 
                      x: 0 - Math.random() * 20, 
                      y: cy + (Math.random() - 0.5) * 15,
                      vx: v_pixel_base,
                      base_vx: v_pixel_base,
                      type: 'neutral',
                      bunch_phase: 0 // Track phase for coloring
                    });
                 }
             }
          }

          if (running) {
              particlesRef.current.forEach((p, i) => {
                 // Check if inside Helix
                 if (p.x >= helix_startX && p.x <= helix_endX) {
                     // Current Phase of the Wave at particle position
                     // Wave travels forward: phase = wt - kz
                     const wave_phase = (frameRef.current * omega_visual) - ((p.x - helix_startX) * k_visual); 
                     const sinVal = Math.sin(wave_phase);

                     // EXPONENTIAL GROWTH (The TWT Magic)
                     // Normalized distance (0 to 1)
                     const z_norm = (p.x - helix_startX) / helix_length_px;
                     
                     // Growth Factor: Starts at 1 (Input), Ends high (Output)
                     // We scale it visually to look good
                     const growth_power = theoretical_gain_db / 15.0; // Scaling for visual exp
                     const amplitude_growth = Math.exp(z_norm * Math.min(3.0, growth_power));
                     
                     // Force Field (Interaction)
                     // F ~ E_z * sin(phase)
                     // Input signal strength
                     const input_drive = (inputs.Vi || 20) / 500.0; 
                     const interaction_strength = input_drive * amplitude_growth;
                     
                     // Apply Velocity Modulation (Continuous)
                     // Particles in retarding field (sinVal > 0) slow down -> Give Energy
                     // Particles in accelerating field (sinVal < 0) speed up -> Take Energy
                     // NOTE: In TWT physics, bunches form in the retarding field.
                     
                     // Visual Tweak: We apply a small accumulated kick
                     const force = interaction_strength * sinVal * 0.15;
                     p.vx = p.base_vx * (1 - force); // minus sign to bunch in retarding zone
                     
                     // Saturation at end
                     if (p.vx < p.base_vx * 0.4) p.vx = p.base_vx * 0.4;
                     if (p.vx > p.base_vx * 2.0) p.vx = p.base_vx * 2.0;

                     // Color Coding based on Interaction
                     // If slowing down (giving energy) -> Bright/White (Productive)
                     // If speeding up (taking energy) -> Red/Dark (Lossy)
                     if (force > 0.02) p.type = 'slow'; // Bunching
                     else if (force < -0.02) p.type = 'fast'; // Anti-bunching
                     else p.type = 'neutral';
                     
                 } else {
                     // Outside Helix
                     if (p.x > helix_endX) p.vx = p.base_vx; // Reset speed at collector
                     p.type = 'neutral';
                 }

                 p.x += p.vx * timeScale;
                 
                 // Recycle
                 if (p.x > width + 20) {
                     particlesRef.current[i] = { 
                      x: 0 - Math.random() * 20, 
                      y: cy + (Math.random() - 0.5) * 15,
                      vx: v_pixel_base,
                      base_vx: v_pixel_base,
                      type: 'neutral'
                    };
                 }
              });
          }

          // --- 4. Drawing ---
          
          // 1. Draw Helix Structure (Static Coil)
          ctx.beginPath();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          const coil_spacing = 8;
          const helix_amp = 30;
          
          for (let x = helix_startX; x <= helix_endX; x += 3) {
              const coil_phase = (x - helix_startX) / coil_spacing * Math.PI * 2;
              // Draw top and bottom parts of helix to look 3D-ish
              const y_coil = cy + Math.cos(coil_phase) * helix_amp;
              // Simple dotted line effect for back of coil? No, simple sine is cleaner
              if (x === helix_startX) ctx.moveTo(x, y_coil);
              else ctx.lineTo(x, y_coil);
          }
          ctx.stroke();

          // 2. Draw The "RF Field Wave" (Growing Amplitude)
          // This visualizes the Electric Field growing along the tube
          ctx.beginPath();
          
          // Dynamic Gradient: Blue (Input) -> Red (Output)
          const gradient = ctx.createLinearGradient(helix_startX, cy, helix_endX, cy);
          gradient.addColorStop(0, "rgba(96, 165, 250, 0.2)"); // Weak Blue
          gradient.addColorStop(0.5, "rgba(167, 139, 250, 0.4)"); // Purple
          gradient.addColorStop(1, "rgba(244, 63, 94, 0.8)");  // Strong Red
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          
          // Draw the growing envelope sine wave
          for (let x = helix_startX; x <= helix_endX; x += 2) {
             const z_norm = (x - helix_startX) / helix_length_px;
             const growth = Math.exp(z_norm * 2.5); // Visual growth curve
             const wave_phase = (frameRef.current * omega_visual) - ((x - helix_startX) * k_visual);
             
             const input_amp = (inputs.Vi || 20) / 20.0; // Base amplitude in pixels
             const y_wave = cy - (Math.sin(wave_phase) * helix_amp * 0.8 * Math.min(1.0, growth * input_amp * 0.1));
             
             if (x === helix_startX) ctx.moveTo(x, y_wave);
             else ctx.lineTo(x, y_wave);
          }
          ctx.stroke();
          
          // Attenuator (The lossy material in the middle)
          const attenX = helix_startX + helix_length_px * 0.4;
          ctx.fillStyle = "rgba(71, 85, 105, 0.5)";
          drawMetal(attenX, cy - 35, 40, 70, '#334155'); // Just a visual block
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "10px monospace";
          ctx.fillText("ATTENUATOR", attenX, cy - 40);

          // Collector
          ctx.fillStyle = '#1e293b'; 
          ctx.fillRect(helix_endX + 10, cy - 40, 40, 80);
          ctx.fillStyle = '#fff'; 
          ctx.font = '10px monospace'; 
          ctx.fillText('COLLECTOR', helix_endX + 10, cy);

          // HUD Info
          ctx.fillStyle = '#fff';
          ctx.font = '14px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`Gain Param (C): ${C.toFixed(3)}`, 20, 30);
          ctx.fillText(`Theo. Gain: ~${theoretical_gain_db.toFixed(1)} dB`, 20, 50);

          // Draw Particles
          particlesRef.current.forEach(p => {
              let color = '#60a5fa'; // Neutral
              let radius = 2.5;

              if (p.x >= helix_startX && p.x <= helix_endX) {
                  // If bunched (slow type), make them prominent
                  if (p.type === 'slow') { 
                      color = '#ffffff'; // White for the "bunch"
                      radius = 3; 
                  } else if (p.type === 'fast') {
                      color = '#ef4444'; // Red for the accelerated ones (anti-bunch)
                      radius = 2;
                  }
              }
              drawElectron(p.x, p.y, radius, color);
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
