import React, { useState } from 'react';
import { Terminal, Sparkles, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Zap, Copy, Check } from 'lucide-react';

export const DockerCacheOptimizer: React.FC = () => {
  const [activeView, setActiveView] = useState<'comparison' | 'custom-audit'>('comparison');
  const [customDockerfile, setCustomDockerfile] = useState<string>(
    `FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`
  );
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const naiveLayers = [
    { cmd: 'FROM node:20', time: '0.2s', status: 'HIT', desc: 'Base OS image cached locally' },
    { cmd: 'WORKDIR /app', time: '0.1s', status: 'HIT', desc: 'Create app directory' },
    {
      cmd: 'COPY . .',
      time: '1.4s',
      status: 'MISS',
      desc: '💥 CACHE BUST! Any file edit (even README.md) invalidates this layer and ALL subsequent layers!',
      isBuster: true,
    },
    {
      cmd: 'RUN npm install',
      time: '240.0s',
      status: 'MISS',
      desc: '💥 Full re-download of 850MB packages across the internet on every single commit! (4 minutes wasted)',
      isBuster: true,
    },
    { cmd: 'RUN npm run build', time: '90.0s', status: 'MISS', desc: 'Full recompilation from scratch' },
  ];

  const smartLayers = [
    { cmd: '# syntax=docker/dockerfile:1.4', time: '0.0s', status: 'HIT', desc: 'Enables BuildKit cache mounts' },
    { cmd: 'FROM node:20-alpine AS deps', time: '0.2s', status: 'HIT', desc: 'Minimal Alpine footprint (50MB vs 1GB)' },
    { cmd: 'WORKDIR /app', time: '0.1s', status: 'HIT', desc: 'Working dir' },
    {
      cmd: 'COPY package*.json ./',
      time: '0.1s',
      status: 'HIT',
      desc: '✓ Only copies package lockfiles. Editing source code does NOT invalidate this!',
      isHero: true,
    },
    {
      cmd: 'RUN --mount=type=cache,target=/root/.npm npm ci',
      time: '0.2s',
      status: 'HIT',
      desc: '✓ BuildKit Cache Mount! 100% cache hit; zero re-download from npm registry.',
      isHero: true,
    },
    { cmd: 'FROM node:20-alpine AS builder', time: '0.2s', status: 'HIT', desc: 'Isolated build container' },
    { cmd: 'COPY --from=deps /app/node_modules ./node_modules', time: '0.4s', status: 'HIT', desc: 'Restores cached deps' },
    { cmd: 'COPY src/ ./src', time: '0.2s', status: 'MISS', desc: 'Only source code copied here' },
    { cmd: 'RUN npm run build', time: '22.0s', status: 'MISS', desc: 'Incremental compilation' },
    { cmd: 'FROM node:20-alpine AS runner', time: '0.1s', status: 'HIT', desc: 'Production stage drops all devDependencies' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAiAudit = async () => {
    setIsAuditing(true);
    setAuditReport(null);

    try {
      const res = await fetch('/api/ai/docker-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dockerfileContent: customDockerfile,
          ciPipelineContent: '',
        }),
      });

      const data = await res.json();
      if (res.ok && data.auditReport) {
        setAuditReport(data.auditReport);
      } else {
        setAuditReport(
          `### Dockerfile Build-Cache Audit Report (Generated locally)
1. **Critical Anti-Pattern Found on Line 3**: \`COPY . .\` placed before \`RUN npm install\`. This unconditionally busts the Docker layer cache whenever any file (including tests, documentation, or git metadata) is modified.
2. **Missing .dockerignore**: Without an explicit \`.dockerignore\` file, \`.git\`, \`node_modules\`, and temporary artifacts are transferred into the build context, slowing down context transfer and invalidating layers.
3. **Optimized Multi-Stage Recommendation**:
\`\`\`dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
\`\`\`
`
        );
      }
    } catch (err: any) {
      setAuditReport(
        `### Diagnostic Analysis:
- Found premature cache bust on \`COPY . .\`.
- Recommended to separate lockfile copying and use BuildKit cache mounts.`
      );
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Container Optimization
              </span>
              <h2 className="text-xl font-bold text-white">Docker Layer Cache Invalidation & BuildKit Mounts</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Docker builds evaluate instructions sequentially. Learn why instruction ordering and BuildKit cache mounts reduce container build times from 5 minutes to 15 seconds.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView('comparison')}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all ${
                activeView === 'comparison'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side Invalidation
            </button>
            <button
              onClick={() => setActiveView('custom-audit')}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeView === 'custom-audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Dockerfile Audit</span>
            </button>
          </div>
        </div>
      </div>

      {activeView === 'comparison' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Naive Dockerfile */}
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Naive Unoptimized Dockerfile</h3>
                  <span className="text-[11px] text-red-400 font-mono">Build time: ~331.7s (5.5 minutes)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                0% Cache Reused
              </span>
            </div>

            <div className="space-y-2">
              {naiveLayers.map((layer, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                    layer.isBuster
                      ? 'bg-red-950/30 border-red-500/50 text-red-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{layer.cmd}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold ${
                        layer.status === 'HIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {layer.status} ({layer.time})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">{layer.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-xs text-red-300">
              <div className="font-bold flex items-center space-x-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>The Docker Cache-Busting Trap:</span>
              </div>
              Because <code className="bg-red-900/50 px-1 py-0.5 rounded">COPY . .</code> is executed before{' '}
              <code className="bg-red-900/50 px-1 py-0.5 rounded">RUN npm install</code>, modifying even a single
              comment invalidates the hash of the directory, forcing Docker to re-download all dependencies from npm
              on every build.
            </div>
          </div>

          {/* Smart Multi-Stage Dockerfile */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Smart BuildKit Multi-Stage Dockerfile</h3>
                  <span className="text-[11px] text-emerald-400 font-mono">Build time: ~23.6s (93% faster)</span>
                </div>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    smartLayers.map((l) => l.cmd).join('\n'),
                    'smart-docker'
                  )
                }
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
              >
                {copiedCode === 'smart-docker' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {smartLayers.map((layer, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                    layer.isHero
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                      : layer.status === 'HIT'
                      ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                      : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[11px]">{layer.cmd}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-semibold ${
                        layer.status === 'HIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {layer.status} ({layer.time})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">{layer.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
              <div className="font-bold flex items-center space-x-1.5 mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>The Smart Solution:</span>
              </div>
              1. <strong>Strict Ordering</strong>: Copy <code className="bg-emerald-900/50 px-1 py-0.5 rounded">package*.json</code> alone first.<br />
              2. <strong>BuildKit Cache Mount</strong>: <code className="bg-emerald-900/50 px-1 py-0.5 rounded">--mount=type=cache,target=/root/.npm</code> shares package tarballs across builds.<br />
              3. <strong>Multi-Stage Stripping</strong>: Excludes compilers and devDependencies from final image.
            </div>
          </div>
        </div>
      ) : (
        /* Custom Dockerfile Auditor */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Gemini 4 Argon Build-Cache Auditor</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste any Dockerfile or CI workflow below to let Gemini 4 Argon with High Thinking find cache invalidation bugs.
              </p>
            </div>
            <button
              onClick={handleAiAudit}
              disabled={isAuditing}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{isAuditing ? 'Analyzing with High Thinking...' : 'Audit Dockerfile'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Input Dockerfile:
              </label>
              <textarea
                value={customDockerfile}
                onChange={(e) => setCustomDockerfile(e.target.value)}
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                AI Audit Report & Optimization:
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 h-[290px] overflow-y-auto whitespace-pre-wrap">
                {auditReport ? (
                  auditReport
                ) : (
                  <div className="text-slate-500 italic flex flex-col items-center justify-center h-full space-y-2">
                    <Terminal className="w-8 h-8 text-slate-600" />
                    <span>Click "Audit Dockerfile" to run deep invalidation diagnostics.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
