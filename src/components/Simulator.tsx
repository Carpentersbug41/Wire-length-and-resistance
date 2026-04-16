import React, { useEffect, useRef, useState } from 'react';
import { Activity, Zap, Ruler, Info } from 'lucide-react';
import TutorChat from './TutorChat';

// --- Constants & Types ---
const WIRE_HEIGHT = 160;
const ATOM_RADIUS = 12;
const ELECTRON_RADIUS = 3;
const BASE_SPEED = 5;
const ELECTRIC_FIELD_ACCEL = 0.2;

interface Electron {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  collisions: number;
  flashTimer: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface Atom {
  x: number;
  y: number;
}

export default function Simulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lengthMultiplier, setLengthMultiplier] = useState<number>(1.5);
  const [avgCollisions, setAvgCollisions] = useState<number>(0);
  
  // Refs for mutable simulation state to avoid dependency cycles in requestAnimationFrame
  const stateRef = useRef({
    electrons: [] as Electron[],
    sparks: [] as Spark[],
    atoms: [] as Atom[],
    nextElectronId: 0,
    nextSparkId: 0,
    completedElectrons: 0,
    totalCollisionsOfCompleted: 0,
    lastSpawnTime: 0,
  });

  // --- Simulation Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Handle DPI scaling
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        generateAtoms(rect.width);
      }
    };

    const generateAtoms = (canvasWidth: number) => {
      const atoms: Atom[] = [];
      const wireWidth = (canvasWidth * 0.8) * (lengthMultiplier / 3); // Max length is 80% of canvas
      const startX = (canvasWidth - wireWidth) / 2;
      const startY = (canvas.height / window.devicePixelRatio - WIRE_HEIGHT) / 2;
      
      const cols = Math.floor(wireWidth / 40);
      const rows = Math.floor(WIRE_HEIGHT / 35);
      
      const spacingX = wireWidth / cols;
      const spacingY = WIRE_HEIGHT / rows;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          // Add slight randomness to atom positions for a more natural lattice
          const offsetX = (Math.random() - 0.5) * 10;
          const offsetY = (Math.random() - 0.5) * 10;
          atoms.push({
            x: startX + i * spacingX + offsetX,
            y: startY + j * spacingY + offsetY,
          });
        }
      }
      stateRef.current.atoms = atoms;
      // Clear electrons when wire changes to prevent them floating outside
      stateRef.current.electrons = [];
      stateRef.current.sparks = [];
      stateRef.current.completedElectrons = 0;
      stateRef.current.totalCollisionsOfCompleted = 0;
      setAvgCollisions(0);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial setup

    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      
      const wireWidth = (canvasWidth * 0.8) * (lengthMultiplier / 3);
      const startX = (canvasWidth - wireWidth) / 2;
      const endX = startX + wireWidth;
      const startY = (canvasHeight - WIRE_HEIGHT) / 2;
      const endY = startY + WIRE_HEIGHT;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 1. Draw Wire Background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)'; // slate-800
      ctx.strokeStyle = 'rgba(71, 85, 105, 1)'; // slate-600
      ctx.lineWidth = 2;
      
      // Draw wire body
      ctx.beginPath();
      ctx.roundRect(startX - 20, startY - 10, wireWidth + 40, WIRE_HEIGHT + 20, 8);
      ctx.fill();
      ctx.stroke();

      // Draw wire cutaways (ends)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.ellipse(startX - 20, startY + WIRE_HEIGHT/2, 10, WIRE_HEIGHT/2 + 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.ellipse(endX + 20, startY + WIRE_HEIGHT/2, 10, WIRE_HEIGHT/2 + 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Draw Atoms (Copper ions)
      ctx.fillStyle = '#ef4444'; // red-500 for positive ions
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      stateRef.current.atoms.forEach(atom => {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, ATOM_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Atom highlight
        ctx.fillStyle = '#fca5a5';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(atom.x - 3, atom.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10;
      });
      ctx.shadowBlur = 0;

      // 3. Spawn Electrons
      if (time - stateRef.current.lastSpawnTime > 100) { // Spawn every 100ms
        stateRef.current.electrons.push({
          id: stateRef.current.nextElectronId++,
          x: startX - 10,
          y: startY + Math.random() * WIRE_HEIGHT,
          vx: BASE_SPEED,
          vy: (Math.random() - 0.5) * 2,
          collisions: 0,
          flashTimer: 0
        });
        stateRef.current.lastSpawnTime = time;
      }

      // 4. Update and Draw Electrons
      for (let i = stateRef.current.electrons.length - 1; i >= 0; i--) {
        const e = stateRef.current.electrons[i];
        
        // Move
        e.x += e.vx;
        e.y += e.vy;

        // Accelerate (Electric Field pulling right)
        if (e.vx < BASE_SPEED) {
          e.vx += ELECTRIC_FIELD_ACCEL;
        }

        // Boundary checks (keep inside wire vertically)
        if (e.y < startY) { e.y = startY; e.vy *= -1; }
        if (e.y > endY) { e.y = endY; e.vy *= -1; }

        // Collision detection with atoms
        let collided = false;
        for (const atom of stateRef.current.atoms) {
          const dx = e.x - atom.x;
          const dy = e.y - atom.y;
          const distSq = dx * dx + dy * dy;
          const minDist = ATOM_RADIUS + ELECTRON_RADIUS + 2;

          if (distSq < minDist * minDist) {
            // Collision!
            e.collisions++;
            e.flashTimer = 15; // Set flash timer
            collided = true;
            
            // Scatter electron
            e.vx = Math.random() * 1.5 + 0.5; // Slow down horizontally
            e.vy = (Math.random() - 0.5) * 6; // Random vertical scatter
            
            // Push out of atom to prevent getting stuck
            const dist = Math.sqrt(distSq);
            e.x = atom.x + (dx / dist) * minDist;
            e.y = atom.y + (dy / dist) * minDist;

            // Create spark
            stateRef.current.sparks.push({
              id: stateRef.current.nextSparkId++,
              x: e.x,
              y: e.y,
              age: 0,
              maxAge: 20
            });
            break; // Only collide with one atom per frame
          }
        }

        // Draw Electron
        if (e.flashTimer > 0) {
          e.flashTimer--;
          const flashIntensity = e.flashTimer / 15;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + flashIntensity * 0.5})`;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 15 + flashIntensity * 10;
        } else {
          ctx.fillStyle = '#22d3ee'; // cyan-400
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15;
        }
        
        ctx.beginPath();
        ctx.arc(e.x, e.y, ELECTRON_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Remove if exited wire
        if (e.x > endX + 30) {
          stateRef.current.completedElectrons++;
          stateRef.current.totalCollisionsOfCompleted += e.collisions;
          
          // Update rolling average
          if (stateRef.current.completedElectrons % 5 === 0) {
            setAvgCollisions(
              stateRef.current.totalCollisionsOfCompleted / stateRef.current.completedElectrons
            );
          }
          
          stateRef.current.electrons.splice(i, 1);
        }
      }
      ctx.shadowBlur = 0;

      // 5. Update and Draw Sparks (Shockwaves)
      for (let i = stateRef.current.sparks.length - 1; i >= 0; i--) {
        const spark = stateRef.current.sparks[i];
        spark.age++;

        const progress = spark.age / spark.maxAge;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const radius = 2 + easeOut * 15;
        const alpha = 1 - progress;

        // Outer shockwave ring
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`; // amber-400
        ctx.lineWidth = 2 * (1 - progress) + 0.5;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner bright ring for more impact
        if (progress < 0.6) {
          const innerAlpha = 1 - (progress / 0.6);
          ctx.strokeStyle = `rgba(255, 255, 255, ${innerAlpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (spark.age >= spark.maxAge) {
          stateRef.current.sparks.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [lengthMultiplier]); // Re-run effect when length changes to regenerate atoms

  // --- Derived Metrics ---
  const resistanceValue = (lengthMultiplier * 10).toFixed(1);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Electrical Resistance Simulator</h1>
            <p className="text-slate-400 text-xs mt-0.5">City & Guilds 2365 Level 2 • Factors affecting resistance</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-4 min-h-0">
        
        {/* Left Column: Simulation & Controls */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Simulation Canvas Container */}
          <div className="relative flex-1 min-h-[250px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full block"
            />
            
            {/* Legend Overlay */}
            <div className="absolute top-4 left-4 flex gap-3 bg-slate-950/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-800/50 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <span className="text-slate-300">Metal Atom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                <span className="text-slate-300">Free Electron</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400"></div>
                <span className="text-slate-300">Collision</span>
              </div>
            </div>
          </div>

          {/* Controls & Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            
            {/* Control: Wire Length */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <Ruler size={18} className="text-cyan-400" />
                  Wire Length
                </div>
                <span className="text-cyan-400 font-mono bg-cyan-400/10 px-2 py-0.5 rounded text-xs">
                  {lengthMultiplier.toFixed(1)}x
                </span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                value={lengthMultiplier}
                onChange={(e) => setLengthMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                <span>Short</span>
                <span>Long</span>
              </div>
            </div>

            {/* Metric: Resistance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 font-medium text-sm mb-1">
                <Activity size={18} />
                Total Resistance (R)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-light text-white font-mono tracking-tight">
                  {resistanceValue}
                </span>
                <span className="text-lg text-slate-500 font-mono">Ω</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Proportional to length (R ∝ L)
              </p>
            </div>

            {/* Metric: Collisions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 font-medium text-sm mb-1">
                <Zap size={18} />
                Avg. Collisions / Electron
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-light text-amber-400 font-mono tracking-tight">
                  {avgCollisions > 0 ? Math.round(avgCollisions) : '--'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                More collisions = harder for current to flow
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: AI Tutor Chat */}
        <div className="w-full lg:w-[380px] shrink-0 h-[400px] lg:h-auto">
          <TutorChat 
            wireLength={lengthMultiplier} 
            resistance={resistanceValue} 
            avgCollisions={avgCollisions} 
          />
        </div>

      </main>
    </div>
  );
}
