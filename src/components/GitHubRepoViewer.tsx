import React, { useState } from 'react';
import { repoFiles } from '../data/repoFiles';
import { RepoFile } from '../types';
import JSZip from 'jszip';
import { GitBranch, Folder, FileCode, Download, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

export const GitHubRepoViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<RepoFile>(repoFiles[0]);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [copiedCloneCmd, setCopiedCloneCmd] = useState<boolean>(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      for (const file of repoFiles) {
        zip.file(file.path, file.content);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smart-build-cache-invalidation-repo.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const cloneCommand = 'git clone https://github.com/student/smart-build-cache-invalidation.git';

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopiedCloneCmd(true);
    setTimeout(() => setCopiedCloneCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Assignment Requirement
              </span>
              <h2 className="text-xl font-bold text-white">GitHub Repository & Open-Source Codebase</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              "submit GitHub repo link". This complete, production-ready codebase includes Content-Addressable hashing, DAG invalidation algorithms, tests, and CI workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Bundling ZIP...' : 'Download Repository (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Quick Clone & Setup commands */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 font-mono text-slate-300">
            <span className="text-slate-500">$</span>
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
              {cloneCommand}
            </span>
          </div>

          <button
            onClick={handleCopyClone}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            {copiedCloneCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCloneCmd ? 'Copied Clone Command!' : 'Copy Clone Command'}</span>
          </button>
        </div>
      </div>

      {/* Codebase Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree: 4 Cols */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-xs">Repository File Tree</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{repoFiles.length} files</span>
          </div>

          <div className="space-y-1">
            {repoFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <div className="truncate font-semibold">{file.path}</div>
                    <div className="text-[10px] text-slate-500 truncate">{file.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Push Instructions */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <span className="font-bold text-slate-300 block">How to Push to your GitHub:</span>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-300">
              <div>git init</div>
              <div>git add .</div>
              <div>git commit -m "feat: smart build cache"</div>
              <div>git branch -M main</div>
              <div>git remote add origin &lt;YOUR_REPO_URL&gt;</div>
              <div>git push -u origin main</div>
            </div>
          </div>
        </div>

        {/* Right Code Viewer: 8 Cols */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 font-mono text-xs">
              <div className="flex items-center space-x-2 text-white">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{selectedFile.path}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {selectedFile.language}
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
              >
                {copiedFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">{selectedFile.description}</p>

            {/* Code Block with line numbers */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto">
              <pre>{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
