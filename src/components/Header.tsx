import React from 'react';
import { Layers, Terminal, Sparkles, BookOpen, GitBranch, Cpu, CheckCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hasApiKey }) => {
  const tabs = [
    { id: 'simulator', label: 'DAG Simulator', icon: Layers, badge: 'Interactive' },
    { id: 'lab', label: '5-Step Lab Guide', icon: BookOpen, badge: 'Assignment' },
    { id: 'docker', label: 'Docker Layer Cache', icon: Terminal, badge: 'Optimizer' },
    { id: 'ai-architect', label: 'High-Thinking AI Lab', icon: Sparkles, badge: 'Gemini 4 Argon' },
    { id: 'assignment-doc', label: 'Learning Document', icon: CheckCircle, badge: 'Submission' },
    { id: 'repo', label: 'GitHub Repository', icon: GitBranch, badge: 'Codebase' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      {/* Top Banner with Classroom Context */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900 px-4 py-2 border-b border-slate-800/80 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Google Classroom • Assignment_4_2
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="font-medium text-slate-200">Course: Automation in Software Development (CSE - AIDD A SEM V)</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-300">Instructor: <span className="text-amber-300 font-medium">Munukuntla Shiva Prasad</span></span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="font-medium">Model: gemini-4-argon</span>
              <span className="px-1.5 py-0.2 text-[9px] uppercase tracking-wider rounded bg-indigo-600/40 text-indigo-200 font-bold">
                High Thinking
              </span>
            </div>
            {hasApiKey ? (
              <span className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>API Connected</span>
              </span>
            ) : (
              <span className="text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Fallback Engine Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Smart Build-Cache Invalidation Studio</h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Content-Addressable Storage (CAS) • Directed Acyclic Graph (DAG) Traversal • Hermetic CI/CD
            </p>
          </div>
        </div>

        {/* Action quick links */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assignment-doc')}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Generate Document</span>
          </button>
          <button
            onClick={() => setActiveTab('repo')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>GitHub Codebase</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-blue-500/30 text-blue-200'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
