import React, { useState, useMemo } from 'react';
import { DAGNode, FileItem, SimulationResult } from '../types';
import { Play, RotateCcw, Clock, Zap, Leaf, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, FileCode, Server, Layers } from 'lucide-react';

interface DagSimulatorProps {
  nodes: DAGNode[];
  files: FileItem[];
  onSelectNodeForAi?: (node: DAGNode) => void;
  onUpdateSimulationMetrics?: (res: SimulationResult) => void;
}

export const DagSimulator: React.FC<DagSimulatorProps> = ({
  nodes: initialNodes,
  files: initialFileList,
  onSelectNodeForAi,
  onUpdateSimulationMetrics,
}) => {
  const [fileList, setFileList] = useState<FileItem[]>(initialFileList);
  const [activePreset, setActivePreset] = useState<string>('leaf-frontend');
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  // Calculate invalidation set
  const { dirtyNodes, cachedNodes, naiveTime, smartTime, timeSaved, hitRatio } = useMemo(() => {
    // 1. Find nodes that have directly modified functional files
    const directlyChangedNodes = new Set<string>();

    for (const f of fileList) {
      if (f.isModified) {
        // If it's a doc file, smart invalidator normalizes and ignores it!
        if (f.type === 'doc') {
          continue; // Smart normalization: documentation changes do NOT bust compiled binary caches!
        }
        directlyChangedNodes.add(f.nodeId);
      }
    }

    // 2. Transitive DAG traversal to find downstream impact radius
    const dirty = new Set<string>(directlyChangedNodes);
    let grew = true;
    while (grew) {
      const prevSize = dirty.size;
      for (const node of initialNodes) {
        if (!dirty.has(node.id)) {
          const dependsOnDirty = node.dependencies.some((depId) => dirty.has(depId));
          if (dependsOnDirty) {
            dirty.add(node.id);
          }
        }
      }
      grew = dirty.size > prevSize;
    }

    const cached = initialNodes.filter((n) => !dirty.has(n.id)).map((n) => n.id);

    // Timing calculation
    const naiveTime = initialNodes.reduce((acc, curr) => acc + curr.baseBuildTimeSec, 0);
    const smartTime = initialNodes
      .filter((n) => dirty.has(n.id))
      .reduce((acc, curr) => acc + curr.baseBuildTimeSec, 0);

    const timeSaved = Math.max(0, naiveTime - smartTime);
    const hitRatio = initialNodes.length > 0 ? (cached.length / initialNodes.length) * 100 : 0;

    return {
      dirtyNodes: dirty,
      cachedNodes: cached,
      naiveTime,
      smartTime,
      timeSaved,
      hitRatio,
    };
  }, [fileList, initialNodes]);

  // Handle Preset Changes
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    let updated = fileList.map((f) => ({ ...f, isModified: false }));

    if (preset === 'leaf-frontend') {
      // Modify only web-frontend Button.tsx
      updated = updated.map((f) =>
        f.path.includes('Button.tsx') ? { ...f, isModified: true } : f
      );
    } else if (preset === 'root-library') {
      // Modify core-utils crypto.ts
      updated = updated.map((f) =>
        f.path.includes('crypto.ts') ? { ...f, isModified: true } : f
      );
    } else if (preset === 'doc-only') {
      // Modify only README.md
      updated = updated.map((f) =>
        f.path.includes('README.md') ? { ...f, isModified: true } : f
      );
    } else if (preset === 'ui-tokens') {
      // Modify design tokens
      updated = updated.map((f) =>
        f.path.includes('tokens.json') ? { ...f, isModified: true } : f
      );
    } else if (preset === 'clean-all') {
      // Zero files modified (full cache hit)
    }

    setFileList(updated);

    // Push metrics to parent
    if (onUpdateSimulationMetrics) {
      const rebuildList = initialNodes.filter((n) => dirtyNodes.has(n.id)).map((n) => n.id);
      onUpdateSimulationMetrics({
        totalNodes: initialNodes.length,
        rebuiltNodes: rebuildList,
        cachedNodes: Array.from(cachedNodes),
        cacheHitRatio: hitRatio,
        naiveBuildTimeSec: naiveTime,
        smartBuildTimeSec: smartTime,
        timeSavedSec: timeSaved,
        timeSavedPercent: Number(((timeSaved / naiveTime) * 100).toFixed(1)),
        carbonSavedGrams: Number(((timeSaved * 0.12) / 60).toFixed(2)),
        computeCostSavedDollars: Number(((timeSaved * 0.0004) / 60).toFixed(3)),
        timestamp: new Date().toLocaleTimeString(),
        invalidationReason: `Preset: ${preset}`,
      });
    }
  };

  const toggleFile = (id: string) => {
    setActivePreset('custom');
    setFileList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isModified: !f.isModified } : f))
    );
  };

  const runBuildSimulation = () => {
    setIsSimulating(true);
    setSimulationLog([]);

    const logs: string[] = [
      `[00:00.01] Initializing Smart Content-Addressable Build Engine...`,
      `[00:00.04] Scanning filesystem inputs and generating Merkle hash tree...`,
    ];

    const modified = fileList.filter((f) => f.isModified);
    if (modified.length === 0) {
      logs.push(`[00:00.08] No modified files detected. All source trees clean.`);
    } else {
      for (const m of modified) {
        if (m.type === 'doc') {
          logs.push(`[00:00.09] File "${m.path}" is markdown/documentation -> Ignored by AST filter! (Zero cache invalidation)`);
        } else {
          logs.push(`[00:00.12] Dirty input detected in "${m.path}" (Hash changed: ${m.hash.substring(0, 8)}...)`);
        }
      }
    }

    logs.push(`[00:00.18] Traversing Monorepo Dependency DAG via Depth-First Search (DFS)...`);
    logs.push(`[00:00.22] Invalidation boundary calculated: ${dirtyNodes.size} package(s) marked DIRTY; ${cachedNodes.length} package(s) verified CLEAN.`);

    for (const node of initialNodes) {
      if (dirtyNodes.has(node.id)) {
        logs.push(`[00:00.35] [CACHE MISS] ${node.name} -> Recompiling target (${node.baseBuildTimeSec}s simulated)`);
      } else {
        logs.push(`[00:00.41] [CACHE HIT ] ${node.name} -> Restored from CAS in 0.08s (Key: cas-sha256-${node.id.substring(0, 6)})`);
      }
    }

    logs.push(`[00:00.50] Build complete. Naive time: ${naiveTime}s | Smart time: ${smartTime}s | Saved: ${timeSaved}s (${((timeSaved / naiveTime) * 100).toFixed(1)}% speedup).`);

    setSimulationLog(logs);
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Interactive Workbench
              </span>
              <h2 className="text-xl font-bold text-white">Monorepo Directed Acyclic Graph (DAG) Invalidation</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Select or modify files in the tree to watch the Smart Build-Cache Invalidation algorithm dynamically calculate transitive invalidation boundaries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => applyPreset('clean-all')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-2 rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Graph</span>
            </button>
            <button
              onClick={runBuildSimulation}
              disabled={isSimulating}
              className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-500/20 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Evaluating CAS...' : 'Execute Smart Build'}</span>
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-2">Quick Test Scenarios:</span>
          {[
            { id: 'leaf-frontend', label: '1. Leaf Edit: Button.tsx (Isolated)', desc: 'Only frontend recompiles' },
            { id: 'root-library', label: '2. Root Edit: crypto.ts (Cascading)', desc: 'Recompiles all dependents' },
            { id: 'ui-tokens', label: '3. Token Edit: theme.css', desc: 'Recompiles frontend only' },
            { id: 'doc-only', label: '4. Doc Edit: README.md (Noise Filter)', desc: '100% Cache hit (Zero rebuild)' },
            { id: 'clean-all', label: '5. Clean State (Unchanged)', desc: 'Full CAS hit' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                activePreset === preset.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cache Hit Ratio</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{hitRatio.toFixed(1)}%</span>
            <span className="text-xs text-slate-400">
              ({cachedNodes.length}/{initialNodes.length} cached)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${hitRatio}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Build Time Saved</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-blue-400">{timeSaved}s</span>
            <span className="text-xs text-slate-400">
              ({((timeSaved / (naiveTime || 1)) * 100).toFixed(0)}% faster)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Smart: {smartTime}s vs Naive: {naiveTime}s
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Rebuilt vs Preserved</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400">{dirtyNodes.size}</span>
            <span className="text-xs text-slate-400">dirty targets</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 font-semibold">{cachedNodes.length}</span>
            <span className="text-xs text-slate-400">hit</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {dirtyNodes.size === 0 ? 'Optimal: Zero rebuilds!' : 'Transitive isolation active'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Carbon & Cost Offset</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">
              {((timeSaved * 0.12) / 60).toFixed(2)}g
            </span>
            <span className="text-xs text-slate-400">CO2e</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Est. CI cost saved: ${((timeSaved * 0.0004) / 60).toFixed(3)}
          </p>
        </div>
      </div>

      {/* Main Grid: DAG Visualizer + File Manifest Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DAG Visualizer (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Monorepo Dependency Graph (DAG)</h3>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Cached (HIT)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Dirty / Rebuild (MISS)</span>
                </span>
              </div>
            </div>

            {/* Visual DAG Nodes representation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {initialNodes.map((node) => {
                const isDirty = dirtyNodes.has(node.id);
                const hasDirectChange = fileList.some((f) => f.nodeId === node.id && f.isModified && f.type !== 'doc');
                const hasDocChangeOnly = fileList.some((f) => f.nodeId === node.id && f.isModified && f.type === 'doc');

                return (
                  <div
                    key={node.id}
                    className={`rounded-xl p-3.5 border transition-all relative overflow-hidden ${
                      isDirty
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {node.type}
                        </span>
                        <h4 className="font-bold text-white text-xs mt-1.5 font-mono">{node.name}</h4>
                      </div>

                      {isDirty ? (
                        <span className="flex items-center space-x-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>MISS</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>HIT</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{node.description}</p>

                    {/* Dependency mapping */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between text-slate-400 font-mono">
                      <span>
                        Deps: {node.dependencies.length > 0 ? node.dependencies.join(', ') : 'none (root)'}
                      </span>
                      <span>{node.baseBuildTimeSec}s build</span>
                    </div>

                    {/* Status badge */}
                    <div className="mt-2 text-[10px]">
                      {hasDirectChange ? (
                        <span className="text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded">
                          ● Direct source modified
                        </span>
                      ) : isDirty ? (
                        <span className="text-orange-300 bg-orange-900/40 px-1.5 py-0.5 rounded">
                          ▲ Transitive upstream dirty
                        </span>
                      ) : hasDocChangeOnly ? (
                        <span className="text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded">
                          ✓ Doc change sanitized (HIT)
                        </span>
                      ) : (
                        <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          ✓ CAS Key Valid (HIT)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Dependency Flow Arrows */}
            <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Topological Invalidation Flow: </span>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">core-utils</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">auth-service</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">api-gateway</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">web-frontend</span>
                <span className="text-slate-600 ml-2">|</span>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">ui-tokens</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">web-frontend</span>
              </div>
            </div>
          </div>

          {/* Invalidation Execution Walkthrough Steps */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              4-Phase Smart Invalidation Pipeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                {
                  step: 1,
                  title: 'Content Hash (CAS)',
                  desc: 'SHA-256 Merkle root of inputs; line-ending normalized',
                },
                {
                  step: 2,
                  title: 'DAG Traversal',
                  desc: 'DFS identifies transitive reverse dependencies',
                },
                {
                  step: 3,
                  title: 'Key Formulation',
                  desc: 'Key = SHA(files + deps + toolchain + env)',
                },
                {
                  step: 4,
                  title: 'Artifact Fetch',
                  desc: 'Fetch cached tarball from local CAS or cloud',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  onClick={() => setActiveStepTab(s.step)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    activeStepTab === s.step
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-white text-[11px]">
                    Step {s.step}: {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* File Manifest & Modifiers (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Monorepo File Manifest</h3>
              </div>
              <span className="text-xs text-slate-500">{fileList.length} files tracked</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Click any file checkbox to toggle modification status and observe live invalidation:
            </p>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {fileList.map((file) => (
                <div
                  key={file.id}
                  onClick={() => toggleFile(file.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    file.isModified
                      ? file.type === 'doc'
                        ? 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                        : 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={file.isModified}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <div className="truncate">
                      <div className="text-xs font-mono truncate">{file.path}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Hash: {file.hash.substring(0, 10)}... | {file.type}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded font-mono ${
                      file.isModified
                        ? file.type === 'doc'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {file.isModified ? (file.type === 'doc' ? 'DOC MOD' : 'DIRTY') : 'CLEAN'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Output Log */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>CLI Execution Trace</span>
              <span className="text-[10px] font-mono text-emerald-400">deterministic</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-300 max-h-36 overflow-y-auto space-y-1">
              {simulationLog.length > 0 ? (
                simulationLog.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('[CACHE HIT ]')
                        ? 'text-emerald-400'
                        : log.includes('[CACHE MISS]')
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }
                  >
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">Click "Execute Smart Build" above to run CAS invalidation engine...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
