import React from 'react';
import { CelestialBody } from '../types';
import { Play, Square, Shuffle, RotateCcw, Activity, ArrowUpRight } from 'lucide-react';

interface ControlsPanelProps {
  bodies: CelestialBody[];
  isRunning: boolean;
  showTrajectories: boolean;
  showVelocities: boolean;
  bodyCount: number;
  setBodyCount: (n: number) => void;
  timeScale: number;
  setTimeScale: (n: number) => void;
  velocityScale: number;
  setVelocityScale: (n: number) => void;
  gravityScale: number;
  setGravityScale: (n: number) => void;
  fragmentOnCollision: boolean;
  setFragmentOnCollision: (v: boolean) => void;
  gameOverOnCollision: boolean;
  setGameOverOnCollision: (v: boolean) => void;
  selectedBodyId: string | null;
  onSelectBody: (id: string | null) => void;
  onTogglePlay: () => void;
  onGenerate: () => void;
  onPerturb: () => void;
  onToggleTrajectories: () => void;
  onToggleVelocities: () => void;
  onUpdateMass: (id: string, newMass: number) => void;
}

export const ControlsPanel = ({
  bodies,
  isRunning,
  showTrajectories,
  showVelocities,
  bodyCount,
  setBodyCount,
  timeScale,
  setTimeScale,
  velocityScale,
  setVelocityScale,
  gravityScale,
  setGravityScale,
  fragmentOnCollision,
  setFragmentOnCollision,
  gameOverOnCollision,
  setGameOverOnCollision,
  selectedBodyId,
  onSelectBody,
  onTogglePlay,
  onGenerate,
  onPerturb,
  onToggleTrajectories,
  onToggleVelocities,
  onUpdateMass,
}: ControlsPanelProps) => {
  return (
    <div className="w-80 bg-slate-900/80 backdrop-blur-md text-slate-100 p-6 flex flex-col gap-6 overflow-y-auto border-l border-slate-800">
      <div>
        <h2 className="text-xl font-bold mb-1">N-Body Simulator</h2>
        <p className="text-xs text-slate-400">Lorenz Attractor & Butterfly Effect</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 font-medium transition-colors ${
              isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onGenerate}
            className="w-full py-2 px-4 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Shuffle size={14} /> New Random Scenario
          </button>
          
          <button
            onClick={onPerturb}
            className="w-full py-2 px-4 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm transition-colors"
            title="Adds a tiny random position offset to see the butterfly effect"
          >
            <RotateCcw size={14} /> Reset with Perturbation
          </button>
          
          <button
            onClick={onToggleTrajectories}
            className={`w-full py-2 px-4 rounded-md border flex items-center justify-center gap-2 text-sm transition-colors ${
              showTrajectories ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Activity size={14} /> {showTrajectories ? 'Hide Trajectories' : 'Show Trajectories'}
          </button>
          
          <button
            onClick={onToggleVelocities}
            className={`w-full py-2 px-4 rounded-md border flex items-center justify-center gap-2 text-sm transition-colors ${
              showVelocities ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight size={14} /> {showVelocities ? 'Hide Velocities' : 'Show Velocities'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Number of Bodies</label>
          <span className="text-sm font-mono text-indigo-400">{bodyCount}</span>
        </div>
        <input
          type="range"
          min="2"
          max="7"
          value={bodyCount}
          onChange={(e) => setBodyCount(parseInt(e.target.value))}
          className="w-full accent-indigo-500"
        />
        
        <div className="flex justify-between items-center mt-4">
          <label className="text-sm font-medium">Time Scale</label>
          <span className="text-sm font-mono text-indigo-400">{timeScale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={timeScale}
          onChange={(e) => setTimeScale(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />

        <div className="flex justify-between items-center mt-4">
          <label className="text-sm font-medium">Initial Velocity</label>
          <span className="text-sm font-mono text-indigo-400">{velocityScale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={velocityScale}
          onChange={(e) => setVelocityScale(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />

        <div className="flex justify-between items-center mt-4">
          <label className="text-sm font-medium">Gravity Multiplier</label>
          <span className="text-sm font-mono text-indigo-400">{gravityScale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="500"
          step="0.1"
          value={gravityScale}
          onChange={(e) => setGravityScale(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-medium text-slate-300">Collision Rules</h3>
        
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-white transition-colors">
          <input 
            type="checkbox" 
            checked={fragmentOnCollision}
            onChange={(e) => setFragmentOnCollision(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
          />
          Fragmentation on Collision
        </label>
        
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-white transition-colors">
          <input 
            type="checkbox" 
            checked={gameOverOnCollision}
            onChange={(e) => setGameOverOnCollision(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500"
          />
          Game Over on Collision
        </label>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <h3 className="text-sm font-medium mb-4 text-slate-300">Celestial Bodies</h3>
        <div className="space-y-4">
          {bodies.map((body, idx) => {
            const isSelected = selectedBodyId === body.id;
            return (
              <div 
                key={body.id} 
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                }`}
                onClick={() => onSelectBody(isSelected ? null : body.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: body.color }} />
                    <span className="text-xs font-medium">Body {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-400">m:</span>
                    <input 
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={parseFloat(body.mass.toFixed(2))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) onUpdateMass(body.id, val);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 bg-slate-800 text-xs text-right border border-slate-700 rounded px-1 text-slate-200 outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
                
                <input
                  type="range"
                  min="0.1"
                  max={body.mass > 50 ? 1000 : 50}
                  step="0.1"
                  value={body.mass}
                  onChange={(e) => onUpdateMass(body.id, parseFloat(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full accent-slate-400"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
