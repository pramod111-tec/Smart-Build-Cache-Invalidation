import React, { useState } from 'react';
import { LabStep } from '../types';
import { assignmentSteps } from '../data/learningSteps';
import { CheckCircle2, ChevronRight, Copy, Check, Terminal, HelpCircle, Award, BookOpen, Lightbulb } from 'lucide-react';

interface StepByStepLabProps {
  onNavigateToDocument: () => void;
}

export const StepByStepLab: React.FC<StepByStepLabProps> = ({ onNavigateToDocument }) => {
  const [steps, setSteps] = useState<LabStep[]>(assignmentSteps);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const activeStep = steps[activeStepIndex];

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleQuizSelect = (stepNumber: number, optionIdx: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [stepNumber]: optionIdx }));
  };

  const toggleStepCompleted = (stepNumber: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.stepNumber === stepNumber ? { ...s, completed: !s.completed } : s))
    );
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Top Banner with Assignment Guidance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Core Assignment Requirement
              </span>
              <h2 className="text-xl font-bold text-white">5-Step Engineering Lab: Invalidation Mechanics</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              "In document add each step and describe properly." Review, experiment with, and verify all 5 foundational steps required for your submission document.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700/80 text-xs flex items-center space-x-3">
              <div>
                <span className="text-slate-400">Assignment Progress:</span>
                <span className="ml-1.5 font-bold text-white">
                  {completedCount}/{steps.length} Steps
                </span>
              </div>
              <div className="w-20 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={onNavigateToDocument}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Award className="w-4 h-4" />
              <span>Compile into Document</span>
            </button>
          </div>
        </div>

        {/* Step Selector Pills */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-slate-800 pt-4">
          {steps.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                activeStepIndex === idx
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-blue-400">Step {s.stepNumber}</span>
                {s.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                )}
              </div>
              <div className="text-[11px] font-medium line-clamp-1 text-slate-200">{s.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Step Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold">
                  Step {activeStep.stepNumber} of 5
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{activeStep.title}</h3>
                <p className="text-sm text-slate-300 mt-1">{activeStep.shortDesc}</p>
              </div>

              <button
                onClick={() => toggleStepCompleted(activeStep.stepNumber)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border flex items-center space-x-1.5 transition-colors ${
                  activeStep.completed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeStep.completed ? 'Marked Complete' : 'Mark as Done'}</span>
              </button>
            </div>

            {/* Objective Box */}
            <div className="mt-4 p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-lg text-xs text-blue-200 flex items-start space-x-2.5">
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-300">Learning Objective: </span>
                {activeStep.objective}
              </div>
            </div>

            {/* Formula / Mathematical Equation */}
            {activeStep.formula && (
              <div className="mt-4 p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Mathematical Invalidation Equation:
                </span>
                <div className="text-sm font-mono text-amber-300 mt-1.5 overflow-x-auto py-1">
                  {activeStep.formula}
                </div>
              </div>
            )}

            {/* In-depth Concept Breakdown */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Detailed Technical Breakdown</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeStep.conceptBreakdown.map((concept, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-blue-400 font-bold mt-0.5">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Executable Production Code Snippet */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>{activeStep.codeSnippet.filename}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(activeStep.codeSnippet.code, activeStep.stepNumber)}
                  className="hover:text-white transition-colors flex items-center space-x-1 text-[11px]"
                >
                  {copiedCodeIndex === activeStep.stepNumber ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{activeStep.codeSnippet.code}</pre>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Key Industrial Takeaways
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeStep.keyTakeaways.map((takeaway, i) => (
                  <div key={i} className="p-2.5 bg-slate-800/50 border border-slate-800 rounded-lg text-xs text-slate-300">
                    <span className="font-bold text-emerald-400 mr-1.5">✓</span>
                    {takeaway}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                Previous Step
              </button>

              <div className="text-xs text-slate-500 font-mono">
                Step {activeStepIndex + 1} of {steps.length}
              </div>

              <button
                disabled={activeStepIndex === steps.length - 1}
                onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                className="text-xs px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-40 flex items-center space-x-1"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Verification Quiz & Learning Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Interactive Quiz Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-white text-sm">Step {activeStep.stepNumber} Check for Understanding</h4>
            </div>

            <p className="text-xs text-slate-300 mb-4">{activeStep.quizQuestion.question}</p>

            <div className="space-y-2">
              {activeStep.quizQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedQuizAnswers[activeStep.stepNumber] === oIdx;
                const hasAnswered = selectedQuizAnswers[activeStep.stepNumber] !== undefined;
                const isCorrect = oIdx === activeStep.quizQuestion.correctIndex;

                let optClass = 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800';
                if (hasAnswered) {
                  if (isCorrect) {
                    optClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300';
                  } else if (isSelected && !isCorrect) {
                    optClass = 'bg-red-950/40 border-red-500/60 text-red-300';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleQuizSelect(activeStep.stepNumber, oIdx)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${optClass}`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-slate-500 text-[11px] mt-0.5">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quiz Feedback */}
            {selectedQuizAnswers[activeStep.stepNumber] !== undefined && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs border ${
                  selectedQuizAnswers[activeStep.stepNumber] === activeStep.quizQuestion.correctIndex
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="font-bold mb-1">
                  {selectedQuizAnswers[activeStep.stepNumber] === activeStep.quizQuestion.correctIndex
                    ? '✓ Correct Answer!'
                    : '✕ Not quite right'}
                </div>
                <div>{activeStep.quizQuestion.explanation}</div>
              </div>
            )}
          </div>

          {/* Instructor & Assignment Guidance Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-amber-400">
              Instructor's Criteria Checklist
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2 bg-slate-800/60 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Submit working GitHub repo link</span>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Document of learnings with all 5 steps described</span>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Benchmark calculations & mathematical formulas</span>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Docker layer cache optimization demonstrated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
