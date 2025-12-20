// src/data/devices.js
export const devices = [
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
        latex: 'X = \\frac{\\beta V_1}{2V_0}\\theta_0, \\quad \\beta = \\frac{\\sin(\\theta_g/2)}{\\theta_g/2}, \\quad P_{out} \\propto J_1(X)'
      },
      explanation: [
        {
            title: "Mechanism of Velocity Modulation",
            text: "Electrons emitted from the cathode are accelerated by a high DC potential V0, entering the interaction region with a uniform DC velocity v0. This velocity is derived from the conservation of energy.",
            eq: "v_0 = \\sqrt{\\frac{2e V_0}{m}} \\approx 0.593 \\times 10^6 \\sqrt{V_0} \\text{ m/s}"
        },
        {
            title: "Interaction Gap Dynamics",
            text: "As the beam passes through the grids of the buncher cavity, it is subjected to an RF voltage V1 sin(ωt). The velocity of the electrons exiting the buncher cavity is modulated by the RF signal:",
            eq: "v(t_1) = v_0 \\left[ 1 + \\frac{\\beta_i V_1}{2 V_0} \\sin(\\omega t_0) \\right]"
        },
        {
            title: "The Bunching Process",
            text: "Following velocity modulation, electrons enter a field-free drift space of length L. Accelerated electrons overtake slower ones, forming bunches. The degree of bunching is quantified by the Bunching Parameter X:",
            eq: "X = \\frac{\\beta_i V_1}{2 V_0} \\frac{\\omega L}{v_0}"
        },
        {
            title: "Efficiency Limits",
            text: "Theoretical analysis using Bessel functions shows that the fundamental component of the beam current is maximized when X = 1.841, leading to a maximum theoretical electronic efficiency of 58%."
        }
      ],
      equations: (p) => {
          const Vo = (p.Vo || 10) * 1000;
          const v0 = 5.93e5 * Math.sqrt(Vo);
          const f = (p.f || 3) * 1e9;
          const omega = 2 * Math.PI * f;
          const d = (p.d || 3) / 1000;
          const L = (p.L || 5) / 100;
          
          const theta_g = (omega * d) / v0;
          
          let beta = 1;
          if (Math.abs(theta_g/2) > 0.001) beta = Math.sin(theta_g/2)/(theta_g/2);

          const theta_0 = (omega * L) / v0; 
          const V1 = p.Vi || 800;
          const X = (beta * V1 / (2 * Vo)) * theta_0;

          const L_opt_meters = (3.682 * Vo * v0) / (omega * beta * V1);
          const L_opt_cm = L_opt_meters * 100;

          return {
            'Beam Velocity': { value: Math.sqrt(2 * 1.759e11 * p.Vo * 1000).toFixed(2), unit: 'm/s', latex: 'v_0 = \\sqrt{\\frac{2eV_0}{m}}' },
            'Bunching Param (X)': { value: X.toFixed(3), unit: '', latex: 'X = \\frac{\\beta V_1}{2V_0}\\theta_0' },
            'Coupling Coeff (β)': { value: beta.toFixed(3), unit: '', latex: '\\beta = \\text{sinc}(\\theta_g/2)' },
            'Gap Angle (θg)': { value: theta_g.toFixed(2), unit: 'rad', latex: '\\theta_g = \\omega d/v_0' },
            'Optimum Drift (L)': { value: L_opt_cm.toFixed(2), unit: 'cm', latex: 'L_{opt} \\approx \\frac{3.68 V_0 v_0}{\\omega \\beta V_1}' },
            'Output Power': { value: (p.Io * p.Vi * 0.582 * 0.5).toFixed(2), unit: 'W', latex: 'P_{out} \\approx I_0 V_1 M_1' }
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
            title: "Stagger Tuning & Bandwidth",
            text: "A major limitation of resonant cavities is narrow bandwidth (High Q). Stagger tuning is employed where intermediate cavities are slightly detuned from the carrier to flatten the gain response, representing a classic gain-bandwidth trade-off."
        }
      ],
      equations: (p) => {
          const Vo = (p.Vo || 15) * 1000;
          const v0 = 5.93e5 * Math.sqrt(Vo);
          const f = (p.f || 3) * 1e9;
          const omega = 2 * Math.PI * f;
          const d = (p.d || 3) / 1000;
          const V1 = p.Vi || 500;
          
          const theta_g = (omega * d) / v0;
          let beta = 1;
          if (Math.abs(theta_g/2) > 0.001) beta = Math.sin(theta_g/2)/(theta_g/2);
          
          const safe_Vi = Math.max(V1, 10); 
          const L_opt_meters = (3.682 * Vo * v0) / (omega * beta * safe_Vi);
          const L_opt_cm = L_opt_meters * 100;
          
          return {
            'Coupling Coeff (β)': { value: beta.toFixed(3), unit: '', latex: '\\beta = \\text{sinc}(\\theta_g/2)' },
            'Optimum Drift (L)': { value: L_opt_cm.toFixed(2), unit: 'cm', latex: 'L_{opt} \\text{ (Inter-cavity)}' },
            'Total Gain': { value: ((p.N || 4) * (p.G || 8)).toFixed(1), unit: 'dB', latex: 'G = N \\cdot G_{stage}' },
            'Power Gain': { value: Math.pow(10, ((p.N || 4) * (p.G || 8)) / 10).toExponential(2), unit: 'linear', latex: 'A_p = 10^{G/10}' },
            'Output Power': { value: ((p.Vi || 500) * (p.Io || 500) * Math.pow(10, ((p.N || 4) * (p.G || 8)) / 10) / 1000).toFixed(2), unit: 'W', latex: 'P_{out} = P_{in} \\times 10^{G/10}' },
            'Efficiency': { value: (((p.Vi || 500) * (p.Io || 500) * Math.pow(10, ((p.N || 4) * (p.G || 8)) / 10)) / (Vo * (p.Io || 500))).toFixed(3), unit: '', latex: '\\eta = \\frac{P_{out}}{V_0 I_0}' }

          };
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
                text: "Utilizes a repeller electrode biased at a negative potential to reverse the electron beam. The 'drift space' is folded back on itself. Fast electrons penetrate deeper into the repeller field, while slow electrons return sooner, creating bunches."
            },
           {
  title: "Transit Time Condition",
  text: "For oscillation, the round-trip transit time T' must correspond to specific portions of the RF cycle (Mode Numbers n):",
  // قمت بتصحيح الـ Backslashes وتعديل المعادلة لتطابق الشرط الفيزيائي (n + 3/4)
  eq: "T' = \\left( n + \\frac{3}{4} \\right) T = \\frac{2\\pi n + \\frac{3\\pi}{2}}{\\omega}"
},
            {
                title: "Electronic Tuning",
                text: "Varying the repeller voltage changes the phase of the returned current, allowing fine frequency control (10-50 MHz) for AFC applications."
            }
        ],
        equations: (p) => ({
          'Mode Number': { value: Math.round(2 * (p.L || 3) * 1e-3 * (p.f || 9) * 1e9 * Math.sqrt(9.11e-31 / (2 * 1.6e-19 * (p.Vo || 600))) - 0.75).toString(), unit: '', latex: 'n = \\lfloor 2Lf\\sqrt{m/2eV_0} - 0.75 \\rfloor' },
          'Transit Time': { value: (2 * (p.L || 3) * 1e-3 / Math.sqrt(2 * 1.6e-19 * (p.Vo || 600) / 9.11e-31) * 1e9).toFixed(3), unit: 'ns', latex: 'T = \\frac{2L}{v_0}' },
          'Repeller Field': { value: ((p.Vr || 350) / ((p.L || 3) * 1e-3)).toFixed(0), unit: 'V/m', latex: 'E_r = V_r/L' },
          'Power Output': { value: ((p.Vo || 600) * 0.05).toFixed(2), unit: 'mW', latex: 'P_{out} \\sim V_0/20' }
        })
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
                title: "Attenuator (Sever)",
                text: "To prevent oscillations from reflected waves, an attenuator is placed along the helix. It absorbs the EM wave but allows the electron bunches (carrying the signal info) to pass through and regenerate the wave."
            },
            {
                title: "Pierce Gain Theory",
                text: "Interaction is described by the Pierce Gain Parameter C. The total power gain accounts for launching losses (-9.54 dB) and the growing wave:",
                eq: "G_{dB} \\approx -9.54 + 47.3 N C"
            }
        ],
        equations: (p) => ({
          'Small-Signal Gain': { value: (47.3 * (p.C || 0.1) * (p.N || 40)).toFixed(1), unit: 'dB', latex: 'G = 47.3CN' },
          'Pierce Parameter': { value: (p.C || 0.1).toFixed(3), unit: '', latex: 'C = (I_0Z_0/4V_0)^{1/3}' },
          'Beam Velocity': { value: (Math.sqrt(2 * 1.759e11 * (p.Vo || 3) * 1000) * 1e-6).toFixed(2), unit: '10⁶ m/s', latex: 'v_0 = \\sqrt{2eV_0/m}' },
          'Output Power': { value: ((p.Vi || 20) * Math.pow(10, 47.3 * (p.C || 0.1) * (p.N || 40) / 20)).toFixed(2), unit: 'W', latex: 'P_{out} = P_{in} \\cdot 10^{G/20}' }
        })
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
            },
            {
                title: "Hartree Condition & Spokes",
                text: "Oscillation begins when RF phase velocity matches electron drift velocity. Electrons forming 'spokes' rotate with the wave, delivering energy to the anode resonators."
            }
        ],
        equations: (p) => ({
          'Hull Cutoff': { value: ((1.759e11 / 8) * Math.pow((p.Bo || 336) * 1e-3, 2) * (Math.pow((p.rb || 30) * 1e-3, 2) - Math.pow((p.ra || 10) * 1e-3, 2)) / 1000).toFixed(2), unit: 'kV', latex: 'V_H = \\frac{eB^2}{8m}(r_b^2-r_a^2)' },
          'Hartree Voltage': { value: (((1.759e11 / 8) * Math.pow((p.Bo || 336) * 1e-3, 2) * (Math.pow((p.rb || 30) * 1e-3, 2) - Math.pow((p.ra || 10) * 1e-3, 2)) / 1000) * (1 - Math.pow((p.ra || 10) / (p.rb || 30), 2 / (p.N || 8)))).toFixed(2), unit: 'kV', latex: 'V_a = V_H[1-(r_a/r_b)^{2/N}]' },
          'Drift Velocity': { value: (((p.Vo || 26) * 1000) / ((p.Bo || 336) * 1e-3 * (p.rb || 30) * 1e-3)).toFixed(0), unit: 'm/s', latex: 'v_d = E/B = V_0/(Br_b)' },
          'Frequency': { value: ((((p.Vo || 26) * 1000) /((p.Bo || 336) * 1e-3 * Math.PI * Math.pow((p.rb || 30) * 1e-3, 2))) * 1e-9 * (1 + (p.tune || 0) / 100)).toFixed(2),unit: 'GHz',latex: 'f = f_0(1 + T/100)'}})},
      // === O-TYPE BWO ===
    { 
      id: 'obwo', 
      name: 'O-Type BWO', 
      type: 'O-TYPE (LINEAR)',
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
        },
        { 
            title: "Energy Extraction", 
            text: "Unlike TWTs, the RF output is extracted at the electron gun end (cathode side) where the backward wave is strongest." 
        }
      ],
      equations: (p) => ({
        'Beam Velocity': { value: (0.593 * Math.sqrt((p.Vo || 5)*1000)).toFixed(2), unit: 'km/s', latex: 'v_e = 5.93 \\cdot 10^5 \\sqrt{V_0}' },
        'Approx Output Power': { value: (((p.Vo || 5) * (p.Io || 100)) * 0.15).toFixed(1), unit: 'W', latex: 'P_{out} \\approx \\eta \\cdot I_0 V_0' }
      })
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
        },
        {
            title: "Backward Wave Interaction",
            text: "The RF energy travels opposite to the electron beam direction (Backward Wave) and is extracted near the electron gun."
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
      }
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
      ],
      desc: 'Bulk semiconductor device utilizing the Transferred Electron Effect (RWH).',
      theory: {
        plain: 'Transferred electron effect: Negative resistance above threshold field.',
        latex: 'E_{th} \\approx 3.2 kV/cm, f = v_d/L'
      },
      explanation: [
        {
            title: "The Two-Valley Model (GaAs)",
            text: "In n-type GaAs, the conduction band has two minima: a central lower valley (high mobility) and satellite upper valleys (low mobility). When E > Threshold (approx 3000 V/cm), electrons transfer to the upper valley, reducing average velocity despite higher field.",
            eq: "\\mu_L \\approx 8000 \\gg \\mu_U \\approx 180 \\text{ cm}^2/V\\cdot s"
        },
        {
            title: "Negative Differential Resistance (NDR)",
            text: "This transfer causes dv/dE < 0. Instabilities form 'High-Field Domains' that drift across the sample at saturated velocity vs ≈ 10^7 cm/s."
        }
      ],
      equations: (p) => ({
        'Electric Field': {
          value: ((p.V || 12) / ((p.L || 10) * 1e-4)).toFixed(0),
          unit: 'V/cm'
        },
        'Threshold Field': { value: '3200', unit: 'V/cm' },
        'Domain Velocity': {
          value: (p.vd || 1e7).toExponential(2),
          unit: 'cm/s'
        },
        'Frequency': {
          value: (((p.vd || 1e7) / ((p.L || 10) * 1e-4)) / 1e9).toFixed(3),
          unit: 'GHz'
        },
        'Output Power': {
          value: (
            ((p.V || 12) / ((p.L || 10) * 1e-4)) > 3200
            ? (p.V || 12) * (p.A || 0.1) * (p.Nd || 1e16) * 1e-18
            : 0
          ).toFixed(3),
          unit: 'W'
        }
      })
    },

    // ===================== TUNNEL =====================
    {  
      id: 'tunnel',  
      name: 'Tunnel Diode',  
      type: 'QUANTUM EFFECT',
      params: [
        { id: 'V', label: 'Bias Voltage', unit: 'mV', min: 0, max: 600, def: 150, step: 10 },
        { id: 'Ip', label: 'Peak Current', unit: 'mA', min: 1, max: 100, def: 10, step: 1 },
        { id: 'Vp', label: 'Peak Voltage', unit: 'mV', min: 50, max: 150, def: 100, step: 5 },
        { id: 'Cj', label: 'Junction Capacitance', unit: 'pF', min: 0.5, max: 20, def: 5, step: 0.5 },
        { id: 'Rs', label: 'Series Resistance', unit: 'Ω', min: 1, max: 20, def: 5, step: 1 }
      ],
      desc: 'Quantum tunneling diode with negative resistance.',
      theory: {
        plain: 'Tunneling Current: I ∝ exp(-const/√E), NDR Region: Vₚ < V < Vᵥ, Speed: τ ≈ 1 ps, Freq: f_max > 100 GHz',
        latex: 'I \\propto e^{-A/\\sqrt{E}}, \\quad \\text{NDR: } V_p < V < V_v, \\quad f_{max} > 100 \\text{ GHz}'
      },
      explanation: [
        {
            title: "Quantum Tunneling",
            text: "Formed from degenerate p-n junctions (>10^19 cm^-3). At low bias, electrons tunnel through the forbidden gap. As voltage increases, bands uncross and current drops, creating a Negative Resistance Region.",
            eq: "I = I_p \exp( - \alpha (V - V_p)^2 )"
        },
        {
            title: "Cutoff Frequency",
            text: "The resistive cutoff frequency is determined by the negative resistance Rn and junction capacitance Cj:",
            eq: "f_{ro} = \\frac{1}{2\\pi R_{min} C_j} \\sqrt{\\frac{R_{min}}{R_s} - 1}"
        }
      ],
      equations: (p) => ({
        'Tunnel Current': {
          value: ((p.Ip || 10) * Math.exp(-Math.pow(((p.V || 150) - (p.Vp || 100)) / 100, 2))).toFixed(3),
          unit: 'mA'
        },
        'Cutoff Freq': {
          value: ((p.Ip || 10) / (2 * Math.PI * 1e-12 * (p.Vp || 100) * 1e-3)).toFixed(1),
          unit: 'GHz'
        }
      })
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
      desc: 'Impact ionization diode operating in avalanche mode.',
      theory: {
        plain: 'Avalanche Phase: φₐ ≈ π/2, Transit Phase: φₜ = ωW/v_s, Total: φ = π, Efficiency: η ∝ 1/(1+ω²τ²)',
        latex: '\\phi_a \\approx \\frac{\\pi}{2}, \\quad \\phi_t = \\frac{\\omega W}{v_s}, \\quad \\phi_{total} = \\pi'
      },
      explanation: [
        {
            title: "Avalanche & Transit Delays",
            text: "Relies on two delays to create 180° phase shift (negative resistance): 1) Avalanche Delay (90°): Current peaks lag voltage peaks due to ionization buildup. 2) Transit Time Delay (90°): Carriers drift across depletion region."
        },
        {
            title: "Power Generation",
            text: "Total 180° shift means current directly opposes voltage, generating maximum power. IMPATTs are the most powerful solid-state sources (up to 100 GHz) but are noisy."
        }
      ],
      equations: (p) => ({
        'Avalanche Field': {
          value: ((p.Vd||90)/((p.W||2)*1e-4)).toFixed(0),
          unit: 'V/cm'
        },
        'Transit Time': {
          value: (((p.W||2)*1e-6/(p.vs||1e7))*1e12).toFixed(2),
          unit: 'ps'
        }
      })
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
      desc: 'Plasma avalanche diode with high oscillation power.',
      theory: {
        plain: 'Plasma Formation: τₐ ≈ 100 ps, Extraction: τₑ = W/v_s, Efficiency: η ≈ 30-60%, Peak P: P_pk = V×I',
        latex: '\\tau_a \\approx 100 \\text{ ps}, \\quad \\tau_e = W/v_s, \\quad \\eta \\approx 30-60\\%, \\quad P_{pk} = VI'
      },
      explanation: [
        {
            title: "Trapped Plasma Mode",
            text: "Overdrives the diode with a massive current pulse, filling the depletion region with a dense plasma that collapses the electric field. The plasma is 'trapped'."
        },
        {
            title: "High Efficiency",
            text: "The slow extraction of this plasma results in low-frequency, high-efficiency (up to 60%) oscillations, unlike the transit-time limited IMPATT mode."
        }
      ],
      equations: (p) => ({
        'Peak Power': { value: ((p.V || 100) * (p.I || 40)).toFixed(0), unit: 'W' },
        'Plasma Density': { value: (p.rho||1e15).toExponential(2), unit: 'cm⁻³' }
      })
    },
];
