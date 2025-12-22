// src/data/devices.js

// General physical constants
const epsilon0 = 8.85e-14; // F/cm
const kbT = 0.0259; // Thermal voltage @ 300K

// === Optical Randomness Control Factor (for Thermal Motion) ===
const VISUAL_DIFFUSION_SCALE = 15.0; 
// ==========================================================

export const devices = [
  // ================= O-TYPE DEVICES (Vacuum Tubes) =================
 {
      id: 'klystron2', 
      name: 'Two-Cavity Klystron', 
      type: 'O-TYPE',
      params: [
        { id: 'Vo', label: 'Beam Voltage (V₀)', unit: 'kV', min: 0.5, max: 200, def: 10, step: 0.5 },
        { id: 'Io', label: 'Beam Current (I₀)', unit: 'mA', min: 1, max: 5000, def: 200, step: 10 },
        { id: 'Vi', label: 'RF Input (V₁)', unit: 'V', min: 0, max: 10000, def: 800, step: 50 },
        { id: 'f', label: 'Frequency', unit: 'GHz', min: 0.1, max: 100, def: 3, step: 0.1 },
        { id: 'L', label: 'Drift Length', unit: 'cm', min: 0.1, max: 50, def: 5, step: 0.1 },
        { id: 'd', label: 'Gap Spacing', unit: 'mm', min: 0.1, max: 20, def: 3, step: 0.1 }
      ],
      desc: 'Fundamental velocity modulation device. Separates beam acceleration from interaction.',
      theory: {
        plain: 'Bunching Parameter: X = βVᵢ/(2V₀)θ₀, Coupling: β = sin(θg/2)/(θg/2), Gain ∝ J₁(X)',
        latex: 'X = \\frac{\\beta V_1}{2V_0}\\theta_0, \\quad \\beta = \\frac{\\sin(\\theta_g/2)}{\\theta_g/2}, \\quad I_2 = 2I_0 J_1(X)'
      },
      explanation: [
        {
            title: "Mechanism of Velocity Modulation",
            text: "Electrons emitted from the cathode are accelerated by a high DC potential V0, entering the interaction region with a uniform DC velocity v0. This velocity is derived from the conservation of energy.",
            eq: "v_0 = \\sqrt{\\frac{2e V_0}{m}} \\approx 0.593 \\times 10^6 \\sqrt{V_0} \\text{ m/s}"
        },
        {
            title: "The Bunching Process",
            text: "Following velocity modulation, electrons enter a field-free drift space of length L. Accelerated electrons overtake slower ones, forming bunches. The degree of bunching is quantified by the Bunching Parameter X:",
            eq: "X = \\frac{\\beta_i V_1}{2 V_0} \\frac{\\omega L}{v_0}"
        }
      ],
      equations: (p) => {
          const Vo = (p.Vo || 10) * 1000;
          const Io = (p.Io || 200) / 1000; // Convert to Amperes
          const v0 = 5.93e5 * Math.sqrt(Vo);
          const f = (p.f || 3) * 1e9;
          const omega = 2 * Math.PI * f;
          const d = (p.d || 3) / 1000;
          const L = (p.L || 5) / 100;
          const V1 = p.Vi || 800;

          // 1. Gap Transit Angle (theta_g)
          const theta_g = (omega * d) / v0;
          
          // 2. Coupling Coefficient (beta)
          let beta = 1;
          if (Math.abs(theta_g/2) > 0.001) beta = Math.sin(theta_g/2)/(theta_g/2);

          // 3. DC Transit Angle (theta_0)
          const theta_0 = (omega * L) / v0; 
          
          // 4. Bunching Parameter (X)
          const X = (beta * V1 / (2 * Vo)) * theta_0;

          // Bessel Function J1(X) approximation
          const J1 = (x) => {
              if (x < 0.01) return x/2;
              return (x/2) - (Math.pow(x,3)/16) + (Math.pow(x,5)/384); 
          };

          // 5. RF Current component (I2) magnitude
          const I2_mag = 2 * Io * J1(X);

          // 6. Beam Loading Conductance (GB)
          const G0 = Io / Vo;
          const GB = (G0 / 2) * (Math.pow(beta, 2) - beta * Math.cos(theta_g / 2));

          // 7. Optimum Drift Length
          const L_opt_meters = (3.682 * Vo * v0) / (omega * beta * V1);
          const L_opt_cm = L_opt_meters * 100;

          return {
            'Beam Velocity (v₀)': { value: v0.toExponential(2), unit: 'm/s', latex: 'v_0' },
            'Gap Transit Angle (θg)': { value: theta_g.toFixed(2), unit: 'rad', latex: '\\theta_g' },
            'Coupling Coeff (β)': { value: beta.toFixed(3), unit: '', latex: '\\beta' },
            'DC Transit Angle (θ₀)': { value: theta_0.toFixed(1), unit: 'rad', latex: '\\theta_0' },
            'Bunching Param (X)': { value: X.toFixed(3), unit: '', latex: 'X' },
            'RF Current (I₂)': { value: (I2_mag * 1000).toFixed(2), unit: 'mA', latex: 'I_2' },
            'Beam Loading (G_B)': { value: GB.toExponential(2), unit: 'S', latex: 'G_B' },
            'Optimum Drift (L_opt)': { value: L_opt_cm.toFixed(2), unit: 'cm', latex: 'L_{opt}' }
          };
      },
      calculate: (params, t) => {
          const Vo = params.Vo * 1000;
          const Io = params.Io / 1000; // Amperes
          const Vi = params.Vi;
          const v0 = 5.93e5 * Math.sqrt(Vo);
          const w = 2 * Math.PI * params.f * 1e9;
          
          // Recalculate physics parameters for animation
          const d = (params.d || 3) / 1000;
          const theta_g = (w * d) / v0;
          let beta = 1;
          if (Math.abs(theta_g/2) > 0.001) beta = Math.sin(theta_g/2)/(theta_g/2);

          const L = params.L / 100;
          const theta_0 = (w * L) / v0;
          const X = (beta * Vi / (2 * Vo)) * theta_0;

          // Bessel J1(X) approximation
          let J1_X = 0;
          if (X < 0.1) J1_X = X/2;
          else J1_X = (X/2) - (Math.pow(X,3)/16) + (Math.pow(X,5)/384);

          // Induced RF Current
          const I2_mag = 2 * Io * J1_X;
          
          return {
              // Current in mA
              current: (Io + I2_mag * Math.cos(w*t - theta_0)) * 1000, 
              // Input Voltage
              voltage: Vi * Math.sin(w*t),
              // Output Power
              power: 0.5 * I2_mag * Vi,
              // Modulated Velocity
              velocity: v0 * (1 + (beta * Vi / (2 * Vo)) * Math.sin(w*t))
          };
      }
    },
     { 
       id: 'klystronMulti', 
       name: 'Multi-Cavity Klystron', 
       type: 'O-TYPE',
       params: [
         { id: 'Vo', label: 'Beam Voltage', unit: 'kV', min: 1, max: 800, def: 15, step: 0.5 },
         { id: 'Io', label: 'Beam Current', unit: 'mA', min: 10, max: 5000, def: 500, step: 50 },
         { id: 'Vi', label: 'Input RF', unit: 'V', min: 0, max: 5000, def: 500, step: 50 },
         { id: 'f', label: 'Frequency', unit: 'GHz', min: 0.1, max: 50, def: 3, step: 0.1 },
         { id: 'N', label: 'Number of Cavities', unit: '', min: 2, max: 12, def: 4, step: 1 },
         { id: 'd', label: 'Gap Spacing', unit: 'mm', min: 0.1, max: 20, def: 3, step: 0.1 },
         { id: 'G', label: 'Gain/Stage', unit: 'dB', min: 1, max: 30, def: 8, step: 0.5 }
       ],
       desc: 'Cascaded bunching for high gain amplification. Used in radar and broadcast.',
       theory: {
         plain: 'Total Gain: G_total = N × G_stage, Power Out: P_out = P_in × 10^(G/10), Efficiency: η = P_out/(V₀I₀)',
         latex: 'G_{total} = N \\times G_{stage}, \\quad P_{out} = P_{in} \\times 10^{G/10}, \\quad \\eta = \\frac{P_{out}}{V_0 I_0}'
       },
       explanation: [
         {
             title: "Cascaded Bunching",
             text: "To enhance gain (typically >50 dB) and bandwidth, multi-cavity klystrons are used. Intermediate cavities are unloaded; the beam induces voltage across them, producing a second stage of velocity modulation stronger than the first."
         },
         {
             title: "Stagger Tuning",
             text: "Stagger tuning is employed where intermediate cavities are slightly detuned from the carrier to flatten the gain response."
         }
       ],
       equations: (p) => {
           const totalGain = (p.N || 4) * (p.G || 8);
           const pin_watts = Math.pow((p.Vi || 500), 2) / 50; // Approx
           const pout = pin_watts * Math.pow(10, totalGain/10);
           return {
             'Total Gain': { value: totalGain.toFixed(1), unit: 'dB', latex: 'G_{tot}' },
             'Power Gain': { value: Math.pow(10, totalGain/10).toExponential(2), unit: 'x', latex: 'A_p' },
             'Est. Efficiency': { value: (Math.min(0.6, pout / ((p.Vo*1000)*(p.Io/1000)))*100).toFixed(1), unit: '%', latex: '\\eta' }
           };
       },
       calculate: (params, t) => { 
           return { current: 100, voltage: params.Vo * 1000, power: 1000 }; 
       }
     },
     { 
         id: 'reflex', 
         name: 'Reflex Klystron', 
         type: 'O-TYPE',
         params: [
           { id: 'Vo', label: 'Beam Voltage', unit: 'V', min: 200, max: 1000, def: 600, step: 10 },
           { id: 'Vr', label: 'Repeller Voltage', unit: 'V', min: 0, max: 800, def: 350, step: 10 },
           { id: 'L', label: 'Repeller Spacing', unit: 'mm', min: 1, max: 10, def: 3, step: 0.1 },
           { id: 'f', label: 'Frequency', unit: 'GHz', min: 1, max: 40, def: 9, step: 0.1 }
         ],
         desc: 'Single-cavity oscillator using a repeller electrode to fold the drift space.',
         theory: {
           plain: 'Transit Time: T = (n + 3/4)/f, Mode Number: n = 1,2,3..., Repeller Voltage: Vᵣ = V₀(1 - 2L²f²m/eV₀)',
           latex: 'T = \\frac{n + 3/4}{f}, \\quad V_r = V_0\\left(1 - \\frac{2L^2 f^2 m}{eV_0}\\right)'
         },
         explanation: [
             {
                 title: "Principle of Operation",
                 text: "Utilizes a repeller electrode biased at a negative potential to reverse the electron beam. The 'drift space' is folded back on itself."
             },
             {
                 title: "Transit Time Condition",
                 text: "For oscillation, the round-trip transit time T' must correspond to specific portions of the RF cycle (Mode Numbers n):",
                 eq: "T' = \\left( n + \\frac{3}{4} \\right) T"
             }
         ],
         equations: (p) => {
             const n = Math.round(2 * (p.L || 3) * 1e-3 * (p.f || 9) * 1e9 * Math.sqrt(9.11e-31 / (2 * 1.6e-19 * (p.Vo || 600))) - 0.75);
             return {
               'Mode Number': { value: n.toString(), unit: '', latex: 'n' },
               'Transit Time': { value: (2 * (p.L || 3) * 1e-3 / Math.sqrt(2 * 1.6e-19 * (p.Vo || 600) / 9.11e-31) * 1e9).toFixed(3), unit: 'ns', latex: 'T' },
               'Repeller Field': { value: ((p.Vr || 350) / ((p.L || 3) * 1e-3)).toFixed(0), unit: 'V/m', latex: 'E_r' }
             };
         },
         calculate: (params, t) => {
             const w = 2 * Math.PI * params.f * 1e9;
             return {
                 current: 0.05 * Math.sin(w*t),
                 voltage: params.Vo,
                 power: 0.1
             };
         }
       },
       {
         id: 'twt', 
         name: 'Traveling Wave Tube', 
         type: 'O-TYPE',
         params: [
           { id: 'Vo', label: 'Beam Voltage', unit: 'kV', min: 1, max: 10, def: 3, step: 0.1 },
           { id: 'Io', label: 'Beam Current', unit: 'mA', min: 10, max: 500, def: 100, step: 10 },
           { id: 'atten', label: 'Attenuator (0=OFF, 1=ON)', unit: '', min: 0, max: 1, def: 1, step: 1 },
           { id: 'Vi', label: 'Input Signal', unit: 'V', min: 0, max: 100, def: 20, step: 1 },
           { id: 'N', label: 'Helix Length', unit: 'λ', min: 10, max: 100, def: 40, step: 1 },
           { id: 'C', label: 'Pierce Parameter', unit: '', min: 0.01, max: 0.5, def: 0.1, step: 0.01 }
         ],
         desc: 'Broadband amplifier using slow-wave structures for continuous interaction.',
         theory: {
           plain: 'Gain: G = (47.3 × C × N)dB, Pierce Param: C = (I₀Z₀/4V₀)^(1/3), Phase Velocity: vₚ = c/n_helix',
           latex: 'G = 47.3CN \\text{ dB}, \\quad C = \\left(\\frac{I_0 Z_0}{4V_0}\\right)^{1/3}, \\quad v_p = \\frac{c}{n}'
         },
         explanation: [
             {
                 title: "The Slow-Wave Structure",
                 text: "Since electrons travel at v0 < c, interaction is impossible in a smooth waveguide. A Helix structure is used to reduce the axial phase velocity of the RF wave to match the beam velocity:",
                 eq: "v_p \\approx c \\sin \\psi"
             },
             {
                 title: "Pierce Gain Theory",
                 text: "Interaction is described by the Pierce Gain Parameter C. The total power gain accounts for launching losses (-9.54 dB) and the growing wave:",
                 eq: "G_{dB} \\approx -9.54 + 47.3 N C"
             }
         ],
         equations: (p) => {
             const G = 47.3 * (p.C || 0.1) * (p.N || 40);
             return {
               'Small-Signal Gain': { value: G.toFixed(1), unit: 'dB', latex: 'G' },
               'Pierce Parameter': { value: (p.C || 0.1).toFixed(3), unit: '', latex: 'C' },
               'Beam Velocity': { value: (Math.sqrt(2 * 1.759e11 * (p.Vo || 3) * 1000) * 1e-6).toFixed(2), unit: '10⁶ m/s', latex: 'v_0' },
               'Output Power': { value: ((p.Vi || 20) * Math.pow(10, G / 20)).toFixed(2), unit: 'W', latex: 'P_{out}' }
             };
         },
         calculate: (params, t) => {
             const G_db = -9.54 + 47.3 * params.N * params.C;
             const G = Math.pow(10, G_db/10);
             const Pout = params.Vi * G; 
             return {
                 current: params.Io,
                 voltage: params.Vo * 1000,
                 power: Pout
             };
         }
       },
       
      { 
         id: 'obwo', 
         name: 'O-Type BWO', 
         type: 'O-TYPE', 
         params: [
           { id: 'Vo', label: 'Beam Voltage', unit: 'kV', min: 1, max: 20, def: 5, step: 0.1 },
           { id: 'Io', label: 'Beam Current', unit: 'mA', min: 10, max: 500, def: 100, step: 10 },
           { id: 'f', label: 'Frequency', unit: 'GHz', min: 1, max: 100, def: 10, step: 0.5 },
           { id: 'L', label: 'Structure Length', unit: 'cm', min: 5, max: 30, def: 15, step: 0.5 }
         ],
         desc: 'O-Type Backward Wave Oscillator. Kinetic energy conversion with continuous bunching along the tube axis.',
         theory: { 
           plain: 'Beam Velocity: v = √(2eV/m)', 
           latex: 'v_e = \\sqrt{\\frac{2e V_{0}}{m}} \\approx v_{phase}' 
         },
         explanation: [
           { 
               title: "O-Type Bunching", 
               text: "Electrons enter with constant velocity. The backward wave's field modulates their velocity, causing fast electrons to catch up with slower ones, forming 'space charge bunches'."
           },
           { 
               title: "Backward Wave", 
               text: "The RF energy travels opposite to the electron beam direction. The interaction initiates near the collector, and the wave grows in amplitude as it travels back towards the gun."
           }
         ],
         equations: (p) => ({
           'Beam Velocity': { value: (0.593 * Math.sqrt((p.Vo || 5)*1000)).toFixed(2), unit: 'km/s', latex: 'v_e' },
           'Approx Output Power': { value: (((p.Vo || 5) * (p.Io || 100)) * 0.15).toFixed(1), unit: 'W', latex: 'P_{out}' }
         }),
         calculate: (params, t) => { return { current: 50, voltage: params.Vo * 1000, power: 50 }; }
       },
       
       // --- CROSSED-FIELD (M-TYPE) ---
       { 
         id: 'magnetron', 
         name: 'Cylindrical Magnetron', 
         type: 'CROSSED-FIELD (M-TYPE)',
         params: [
           { id: 'Vo', label: 'Anode Voltage', unit: 'kV', min: 1, max: 1000, def: 26, step: 0.5 },
           { id: 'Bo', label: 'Magnetic Field', unit: 'mT', min: 10, max: 600, def: 336, step: 5 },
           { id: 'N', label: 'Number of Cavities', unit: '', min: 6, max: 16, def: 8, step: 2 },
           { id: 'ra', label: 'Cathode Radius', unit: 'mm', min: 5, max: 20, def: 10, step: 0.5 },
           { id: 'rb', label: 'Anode Radius', unit: 'mm', min: 20, max: 50, def: 30, step: 1 },
           { id: 'tune', label: 'Mech. Tuning', unit: '%', min: 0, max: 100, def: 0, step: 5 }
         ],
         desc: 'High-power crossed-field oscillator. Ubiquitous in radar and microwave ovens.',
         theory: {
           plain: 'Hull Cutoff: Vₕ = (eB²/8m)(rᵦ² - rₐ²), Hartree: Vₐ = Vₕ[1-(rₐ/rᵦ)^(2/N)], Freq: f = v_drift/(πrᵦ)',
           latex: 'V_H = \\frac{eB^2}{8m}(r_b^2 - r_a^2), \\quad V_a = V_H\\left[1-\\left(\\frac{r_a}{r_b}\\right)^{2/N}\\right]'
         },
         explanation: [
             {
                 title: "Crossed-Field Physics",
                 text: "Operates with E perpendicular to B. Electrons surrender potential energy to the RF field while drifting toward the anode. The drift velocity is independent of electron energy:",
                 eq: "v_x = \\frac{E_y}{B_z}"
             },
             {
                 title: "Hull Cutoff Condition",
                 text: "Magnetic field must be strong enough to prevent electrons from flying directly to the anode in absence of RF. This voltage threshold is:",
                 eq: "V_{0c} = \\frac{e B_0^2 b^2}{8m} \\left( 1 - \\frac{a^2}{b^2} \\right)^2"
             }
         ],
         equations: (p) => {
             const B = (p.Bo || 336) * 1e-3;
             const ra = (p.ra || 10) * 1e-3;
             const rb = (p.rb || 30) * 1e-3;
             const Vo = (p.Vo || 26) * 1000;
             const e_m = 1.759e11;
             
             const Vc = (e_m/8) * B*B * rb*rb * Math.pow(1 - (ra*ra)/(rb*rb), 2);
             const Va = Vc * (1 - Math.pow(ra/rb, 2/(p.N || 8)));
             
             return {
               'Hull Cutoff': { value: (Vc/1000).toFixed(2), unit: 'kV', latex: 'V_H' },
               'Hartree Voltage': { value: (Va/1000).toFixed(2), unit: 'kV', latex: 'V_a' },
               'Drift Velocity': { value: (Vo / (B*rb)).toFixed(0), unit: 'm/s', latex: 'v_d = E/B' },
               'Frequency': { value: ((Vo / (B * Math.PI * rb*rb)) * 1e-9 * (1 + (p.tune || 0) / 100)).toFixed(2), unit: 'GHz', latex: 'f' }
             };
         },
         calculate: (params, t) => {
             return { current: 10, voltage: params.Vo * 1000, power: 1000 };
         }
       },

     // === M-TYPE BWO (CARCINOTRON) ===
     { 
       id: 'carcinotron', 
       name: 'Carcinotron (M-BWO)', 
       type: 'CROSSED-FIELD (M-TYPE)',
       params: [
         { id: 'Vo', label: 'Anode Voltage', unit: 'kV', min: 1, max: 50, def: 20, step: 0.5 },
         { id: 'Bo', label: 'Magnetic Field', unit: 'mT', min: 50, max: 800, def: 350, step: 5 },
         { id: 'd',  label: 'Sole-Anode Gap', unit: 'mm', min: 1, max: 15, def: 8, step: 0.5 }
       ],
       desc: 'M-Type Backward Wave Oscillator. Uses crossed E and B fields. Electrons drift perpendicular to both fields.',
       theory: { 
         plain: 'Drift Velocity: v_e = E/B', 
         latex: 'v_e = \\frac{E}{B} = \\frac{V_a}{d \\cdot B}' 
       },
       explanation: [
         { 
             title: "Crossed-Field Drift", 
             text: "Electrons drift perpendicular to both the electric field (E) and magnetic field (B) with a constant drift velocity determined by E/B." 
         },
         { 
             title: "Potential Energy Exchange", 
             text: "Electrons in a decelerating field lose potential energy and drift towards the Anode (upward). Electrons in an accelerating field gain energy and move towards the Sole (downward)." 
         }
       ],
       equations: (p) => {
         const V = (p.Vo || 20) * 1e3; 
         const B = (p.Bo || 350) * 1e-3; 
         const d = (p.d || 8) * 1e-3; 
         const E = V / d;
         const v_drift = E / B;
         return {
           'Electric Field (E)': { value: (E/1e6).toFixed(2), unit: 'MV/m', latex: 'E = V/d' },
           'Drift Velocity (ve)': { value: (v_drift).toExponential(2), unit: 'm/s', latex: 'v_e = E/B' },
           'Approx Frequency': { value: (v_drift / 1e7 * 2.5).toFixed(2), unit: 'GHz', latex: 'f \\propto v_e' }
         };
       },
       calculate: (params, t) => { return { current: 10, voltage: params.Vo * 1000, power: 100 }; }
     },
       
     // ===================== MICROWAVE SOLID-STATE DEVICES =====================
     {  
       id: 'gunn',  
       name: 'Gunn Diode',  
       type: 'SOLID-STATE',
       params: [
         { id: 'V', label: 'Bias Voltage', unit: 'V', min: 0, max: 30, def: 12, step: 0.5 },
         { id: 'L', label: 'Active Length', unit: 'µm', min: 5, max: 20, def: 10, step: 0.5 },
         { id: 'A', label: 'Active Area', unit: 'mm²', min: 0.01, max: 1, def: 0.1, step: 0.01 },
         { id: 'T', label: 'Temperature', unit: '°C', min: 20, max: 150, def: 50, step: 5 },
         { id: 'Nd', label: 'Doping Density', unit: 'cm⁻³', min: 1e14, max: 1e17, def: 1e16, step: 1e15 },
         { id: 'vd', label: 'Domain Velocity', unit: 'cm/s', min: 5e6, max: 2e7, def: 1e7, step: 5e5 },
         { id: 'Vth', label: 'Threshold Field', unit: 'kV/cm', min: 2, max: 5, def: 3.2, step: 0.1 }
       ],
       desc: 'Transferred Electron Device (TED). Relies on bulk material properties rather than PN junctions. Uses n-type GaAs or InP.',
       theory: {
         plain: 'Ridley-Watkins-Hilsum (RWH) Theory. Two-Valley Model (GaAs). Threshold Field ~ 3000 V/cm.',
         latex: 'v_d = \\mu E, \\quad n_0 L > 10^{12} \\text{ cm}^{-2} \\text{ (for oscillation)}'
       },
       explanation: [
         {
             title: "Two-Valley Model Theory (GaAs)",
             text: "In n-type GaAs, a high-mobility lower valley is separated by an energy gap (0.36 eV) from a low-mobility upper valley. When the electric field E > Threshold (approx 3000 V/cm), electrons transfer from the high-mobility lower valley to the low-mobility upper valley.",
             eq: "\\mu_L \\approx 8000 \\gg \\mu_U \\approx 180 \\text{ cm}^2/V\\cdot s"
         },
         {
             title: "Negative Differential Resistance",
             text: "This transfer decreases drift velocity as the electric field increases (dv/dE < 0), causing negative resistance. This leads to the formation of high-field domains."
         },
         {
             title: "Modes of Operation",
             text: "1. Gunn Oscillation Mode (transit-time freq). 2. Stable Amplification Mode. 3. LSA Mode (Limited Space-charge Accumulation). 4. Bias-circuit oscillation mode."
         },
         {
             title: "Tuning",
             text: "Can be tuned mechanically (cavity screw), electrically (Varactor), or magnetically (YIG sphere) for lower phase noise."
         }
       ],
       equations: (p) => {
           const L = (p.L || 10);
           const V = (p.V || 12);
           const E = V / (L * 1e-4);
           const Nd = (p.Nd || 1e16);
           return {
             'Electric Field': { value: (E/1000).toFixed(2), unit: 'kV/cm', latex: 'E = V/L' },
             'Threshold Field': { value: (p.Vth || 3.2), unit: 'kV/cm', latex: 'E_{th}' },
             'Frequency': { value: (((p.vd || 1e7) / (L * 1e-4)) / 1e9).toFixed(3), unit: 'GHz', latex: 'f = v_d/L' },
             'Mode Criterion (n₀L)': { value: (Nd * L * 1e-4).toExponential(2), unit: 'cm⁻²', latex: 'n_0 L > 10^{12}' }
           };
       },
       calculate: (params, t) => {
           const E = (params.V / ((params.L || 10) * 1e-4));
           const Eth = (params.Vth || 3.2) * 1000;
           
           const f = 1e7 / (params.L || 10); 
           const omega = 2 * Math.PI * f * 1e-9; 
           const osc = E > Eth ? Math.sin(omega * t * 10) : 0;

           return {
               current: 10 * (1 + 0.5*osc), 
               voltage: params.V + osc,
               power: params.V * 0.1 
           };
       }
     },

     // ===================== TUNNEL =====================
     {  
       id: 'tunnel',  
       name: 'Tunnel Diode',  
       type: 'QUANTUM EFFECT',
       params: [
         { id: 'Vbias', label: 'Bias Voltage', unit: 'mV', min: 0, max: 600, def: 150, step: 10 },
         { id: 'Ip', label: 'Peak Current', unit: 'mA', min: 1, max: 100, def: 10, step: 1 },
         { id: 'Vp', label: 'Peak Voltage', unit: 'mV', min: 50, max: 150, def: 100, step: 5 },
         { id: 'Vv', label: 'Valley Voltage', unit: 'mV', min: 200, max: 600, def: 350, step: 20 },
         { id: 'Iv', label: 'Valley Current', unit: 'mA', min: 0.1, max: 5, def: 1, step: 0.1 },
         { id: 'Cj', label: 'Junction Capacitance', unit: 'pF', min: 0.5, max: 20, def: 5, step: 0.5 },
         { id: 'Rs', label: 'Series Resistance', unit: 'Ω', min: 1, max: 20, def: 5, step: 1 }
       ],
       desc: 'Heavily doped PN junction using quantum mechanical tunneling. Very high speed.',
       theory: {
         plain: 'Total Current = Diffusion + Tunneling + Excess Current. Negative Resistance Region.',
         latex: 'I_{total} = I_{diff} + I_{tunnel} + I_{excess}, \\quad V_p < V < V_v'
       },
       explanation: [
         {
             title: "Quantum Tunneling",
             text: "Formed from degenerate p-n junctions (doping > 10^19 cm^-3). At low bias, electrons tunnel through the forbidden gap. As voltage increases, bands uncross and current drops, creating a Negative Resistance Region."
         },
         {
             title: "Current Components",
             text: "1. Normal Diode Current (Diffusion). 2. Tunneling Current (Quantum effect). 3. Excess Current (Tunneling through bulk states in energy gap)."
         },
         {
             title: "Pros & Cons",
             text: "Advantages: Very high speed (microwave RF), long-term stability. Disadvantages: Hard to reproduce, low peak-to-valley current ratio."
         }
       ],
       equations: (p) => {
           const V = p.Vbias || 150;
           const Vp = p.Vp || 100;
           const Ip = p.Ip || 10;
           return {
             'Tunnel Current': {
               value: (Ip * Math.exp(-Math.pow((V - Vp) / 100, 2))).toFixed(3),
               unit: 'mA',
               latex: 'I(V)'
             },
             'Peak-Valley Ratio': { value: (Ip / (p.Iv || 1)).toFixed(2), unit: '', latex: 'I_p/I_v' },
             'Operating Point': { value: V, unit: 'mV', latex: 'V_{bias}' }
           };
       },
       calculate: (params, t) => {
           const v = params.Vbias;
           const Vp = params.Vp || 100;
           const Vv = params.Vv || 350;
           const Ip = params.Ip || 10;
           const Iv = params.Iv || 1;
           
           let i = 0;
           if (v < Vp) i = (Ip/Vp) * v;
           else if (v < Vv) i = Ip - ((Ip - Iv)/(Vv - Vp))*(v - Vp);
           else i = Iv + (v - Vv) * 0.1;

           return { current: i, voltage: v, power: i*v };
       }
     },

     // ===================== IMPATT =====================
     {  
       id: 'impatt',  
       name: 'IMPATT Diode',  
       type: 'AVALANCHE TRANSIT',
       params: [
         { id: 'Vd', label: 'Breakdown Voltage', unit: 'V', min: 50, max: 150, def: 90, step: 1 },
         { id: 'I', label: 'Current', unit: 'mA', min: 10, max: 500, def: 200, step: 10 },
         { id: 'W', label: 'Drift Width', unit: 'µm', min: 0.5, max: 5, def: 2, step: 0.1 },
         { id: 'eps', label: 'Permittivity', unit: 'F/m', min: 8e-12, max: 13e-12, def: 12e-12, step: 1e-12 },
         { id: 'vs', label: 'Saturation Velocity', unit: 'cm/s', min: 5e6, max: 2e7, def: 1e7, step: 5e5 }
       ],
       desc: 'IMPact ionisation Avalanche Transit Time. Read Diode structure (n+-p-i-p+).',
       theory: {
         plain: 'Total Delay = Avalanche Delay (90°) + Transit Time Delay (90°) = 180°. Negative Resistance.',
         latex: '\\theta = \\omega \\tau = \\pi, \\quad f \\approx \\frac{v_d}{2L}, \\quad \\eta \\approx 5-10\\%'
       },
       explanation: [
         {
             title: "Read Diode Structure",
             text: "Typically uses n+-p-i-p+ structure. Avalanche multiplication occurs in the high-field p region. The intrinsic (i) region acts as the drift space."
         },
         {
             title: "Principle of Operation",
             text: "Negative resistance is achieved by creating a 180° phase shift between voltage and current: 1) Avalanche Delay due to buildup time. 2) Transit Time Delay as carriers drift across the depletion region."
         },
         {
             title: "Performance",
             text: "High power capability (10W+). 3-100 GHz. GaAs devices generally perform better than Silicon. High phase noise due to avalanche statistics."
         }
       ],
       equations: (p) => ({
         'Avalanche Field': {
           value: ((p.Vd||90)/((p.W||2)*1e-4)).toFixed(0),
           unit: 'V/cm',
           latex: 'E_{bd}'
         },
         'Transit Time': {
           value: (((p.W||2)*1e-6/(p.vs||1e7))*1e12).toFixed(2),
           unit: 'ps',
           latex: '\\tau'
         },
         'Approx Frequency': {
            value: ((p.vs || 1e7) / (2 * (p.W || 2) * 1e-4) / 1e9).toFixed(1),
            unit: 'GHz',
            latex: 'f \\approx v_s/2W'
         }
       }),
       calculate: (params, t) => {
           return { current: params.I, voltage: params.Vd, power: params.Vd * params.I };
       }
     },

     // ===================== TRAPATT =====================
     {  
       id: 'trapatt',  
       name: 'TRAPATT Diode',  
       type: 'AVALANCHE TRANSIT',
       params: [
         { id: 'V', label: 'Pulse Voltage', unit: 'V', min: 50, max: 200, def: 100, step: 5 },
         { id: 'I', label: 'Peak Current', unit: 'A', min: 10, max: 100, def: 40, step: 5 },
         { id: 'W', label: 'Drift Width', unit: 'µm', min: 2, max: 10, def: 5, step: 0.5 },
         { id: 'alpha', label: 'Ionization Rate', unit: 'cm⁻¹', min: 5e3, max: 2e4, def: 1e4, step: 5e2 },
         { id: 'rho', label: 'Plasma Density', unit: 'cm⁻³', min: 1e13, max: 1e17, def: 1e15, step: 1e14 }
       ],
       desc: 'Trapped Plasma Avalanche Triggered Transit. High efficiency microwave generator derived from IMPATT.',
       theory: {
         plain: 'Trapped Plasma Mode. High Efficiency (15-60%). High Current Densities.',
         latex: '\\eta \\approx 15-60\\%, \\quad P_{pk} \\approx 1.2 \\text{ kW}'
       },
       explanation: [
         {
             title: "Trapped Plasma Formation",
             text: "A high-field avalanche zone propagates through the diode, filling the depletion layer with a dense plasma of electrons and holes. This plasma becomes 'trapped' in the low-field region."
         },
         {
             title: "Operation Cycle",
             text: "Charging -> Plasma Formation -> Plasma Extraction -> Residual Extraction. Operates at current densities well in excess of normal avalanche operation."
         },
         {
             title: "Comparison",
             text: "Unlike IMPATT, TRAPATT has much higher efficiency (up to 75% at 0.6 GHz) but is very noisy (>30dB). Used in pulsed transmitters."
         }
       ],
       equations: (p) => ({
         'Peak Power': { value: ((p.V || 100) * (p.I || 40)).toFixed(0), unit: 'W', latex: 'P_{pk}' },
         'Efficiency': { value: '15-60', unit: '%', latex: '\\eta' }
       }),
       calculate: (params, t) => {
           return { current: params.I, voltage: params.V, power: params.I * params.V };
       }
     },
];

// تهيئة الحاملات (Initial Carriers)
export const initializeCarriers = (deviceType, params, width) => {
    let carriers = { electrons: [], holes: [] };
    const numCarriers = 80; 

    // منطق مشترك للأجهزة المضافة
    if (['klystronMulti', 'obwo', 'carcinotron'].includes(deviceType)) {
         return carriers; 
    }

    if (deviceType === 'gunn') {
        for(let i=0; i<numCarriers; i++) {
            carriers.electrons.push({
                x: Math.random() * width,
                vx: 0,
                id: i
            });
        }
    } else if (deviceType === 'impatt' || deviceType === 'trapatt') {
        for(let i=0; i<numCarriers/2; i++) {
            carriers.electrons.push({ x: Math.random() * width, vx: 0, id: i });
            carriers.holes.push({ x: Math.random() * width, vx: 0, id: i + 1000 });
        }
    } else if (deviceType === 'tunnel') {
        for(let i=0; i<numCarriers; i++) {
             carriers.electrons.push({ x: Math.random() * (width/2), vx: 0, id: i });
             carriers.holes.push({ x: (width/2) + Math.random() * (width/2), vx: 0, id: i + 2000 });
        }
    }
    return carriers;
};

// دالة التحريك (Animation Logic)
export const animate = (deviceType, deviceState, params, dt, width) => {
    if (!['gunn', 'impatt', 'trapatt', 'tunnel'].includes(deviceType)) {
        return deviceState;
    }

    let E_field = [];
    let junctions = [];
    
    if (deviceType === 'gunn') {
        junctions = [0, width]; 
        // Note: Using params.L from new input structure
        const L = params.L || 10;
        const V = params.V || 12;
        const appliedVoltage = V;
        const avgField = appliedVoltage / (L * 1e-4); 
        E_field = [avgField, avgField, avgField]; 
        
        const Vth = params.Vth || 3.2; // kV/cm
        
        // Threshold check (approximate)
        if (avgField > Vth * 1000) {
             E_field.push(avgField * 3); 
        }

    } else if (deviceType === 'impatt') {
        junctions = [width * 0.2, width * 0.4]; 
        E_field = [1000, 200000, 5000]; 
    } else if (deviceType === 'trapatt') {
        junctions = [width * 0.1, width * 0.9];
        E_field = [500, 1000, 500];
    } else if (deviceType === 'tunnel') {
        junctions = [width * 0.48, width * 0.52]; 
        E_field = [100, 100000, 100]; 
    } else {
        junctions = [width/2, width/2];
        E_field = [0,0,0];
    }

    deviceState.carriers.electrons.forEach(electron => {
        let E = 0;
        if (deviceType === 'gunn') {
             if (E_field.length > 3) {
                 const timeFactor = (Date.now() / 1000) % 1; 
                 const domainPos = timeFactor * width;
                 if (Math.abs(electron.x - domainPos) < width*0.1) E = E_field[3];
                 else E = E_field[0];
             } else {
                 E = E_field[0];
             }
        } else {
             if (electron.x < junctions[0]) E = E_field[0];
             else if (electron.x < junctions[1]) E = E_field[1];
             else E = E_field[2];
        }

        let mu = params.mu_n || 1000;
        if (deviceType === 'gunn' && Math.abs(E) > 3500) mu = mu / 5; 

        let v = -mu * E * 0.0001; 

        let randomJitter = (Math.random() - 0.5) * VISUAL_DIFFUSION_SCALE * dt * 100;
        
        if (v > 200) v = 200;
        if (v < -200) v = -200;

        electron.x += (v * dt) + randomJitter;

        if (electron.x > width) electron.x = 0;
        if (electron.x < 0) electron.x = width;
        
        // TUNNEL Diode Logic with correct param name (Vbias)
        if (deviceType === 'tunnel') {
             const voltage = params.Vbias || params.V || 0;
             if (Math.abs(electron.x - width/2) < 5 && voltage > 0) {
                 if (Math.random() < 0.1) electron.x = width/2 + 10; 
             }
        }
    });

    deviceState.carriers.holes.forEach(hole => {
        let E = 0;
        if (hole.x < junctions[0]) E = E_field[0];
        else if (hole.x < junctions[1]) E = E_field[1];
        else E = E_field[2];

        let v = (params.mu_p || 400) * E * 0.0001;

        let randomJitter = (Math.random() - 0.5) * VISUAL_DIFFUSION_SCALE * dt * 100;
        hole.x += (v * dt) + randomJitter;

        if (hole.x > width) hole.x = 0;
        if (hole.x < 0) hole.x = width;
    });

    if (deviceType === 'impatt' || deviceType === 'trapatt') {
         const avalancheRegionStart = junctions[0];
         const avalancheRegionEnd = junctions[1];
         let newElectrons = [];
         let newHoles = [];

         let multiplicationFactor = 1;
         // Check for breakdown voltage param (Vd or Vb or V)
         const voltage = params.Vd || params.Vb || params.V || 0;
         
         if (voltage > 50) multiplicationFactor = 1.05;

         if (multiplicationFactor > 1) {
             deviceState.carriers.electrons.forEach(e => {
                 if (e.x > avalancheRegionStart && e.x < avalancheRegionEnd) {
                     if (Math.random() < 0.02) { 
                         const offset = (Math.random() - 0.5) * 10;
                         newElectrons.push({ x: e.x + offset, vx: 0, id: Date.now() + Math.random() });
                         newHoles.push({ x: e.x + offset, vx: 0, id: Date.now() + Math.random()+1 });
                     }
                 }
             });
         }
         
         if (deviceState.carriers.electrons.length < 200) {
             deviceState.carriers.electrons.push(...newElectrons);
             deviceState.carriers.holes.push(...newHoles);
         }
         
         if (deviceState.carriers.electrons.length > 250) {
             deviceState.carriers.electrons.splice(0, 10);
             deviceState.carriers.holes.splice(0, 10);
         }
    }

    return deviceState;
};
