import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DagSimulator } from './components/DagSimulator';
import { StepByStepLab } from './components/StepByStepLab';
import { DockerCacheOptimizer } from './components/DockerCacheOptimizer';
import { HighThinkingArchitect } from './components/HighThinkingArchitect';
import { AssignmentDocGenerator } from './components/AssignmentDocGenerator';
import { GitHubRepoViewer } from './components/GitHubRepoViewer';
import { initialDAGNodes, initialFiles } from './data/sampleRepo';
import { SimulationResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [simulationMetrics, setSimulationMetrics] = useState<SimulationResult | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
      })
      .catch(() => {
        setHasApiKey(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} hasApiKey={hasApiKey} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'simulator' && (
          <DagSimulator
            nodes={initialDAGNodes}
            files={initialFiles}
            onUpdateSimulationMetrics={(res) => setSimulationMetrics(res)}
          />
        )}

        {activeTab === 'lab' && (
          <StepByStepLab onNavigateToDocument={() => setActiveTab('assignment-doc')} />
        )}

        {activeTab === 'docker' && <DockerCacheOptimizer />}

        {activeTab === 'ai-architect' && <HighThinkingArchitect />}

        {activeTab === 'assignment-doc' && (
          <AssignmentDocGenerator simulationMetrics={simulationMetrics} />
        )}

        {activeTab === 'repo' && <GitHubRepoViewer />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CSE - AIDD A SEM V (2026–27) • Automation in Software Development • Assignment 4.2
          </div>
          <div>
            Smart Build-Cache Invalidation Engine • Powered by{' '}
            <span className="text-indigo-400 font-medium">gemini-4-argon (ThinkingLevel.HIGH)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
