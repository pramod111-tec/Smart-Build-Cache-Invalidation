export interface DAGNode {
  id: string;
  name: string;
  type: 'library' | 'service' | 'frontend' | 'ml-model' | 'database';
  dependencies: string[]; // IDs of nodes this node depends on
  files: string[];
  baseBuildTimeSec: number;
  status: 'clean' | 'dirty' | 'cached' | 'rebuilt';
  cacheKey?: string;
  lastHash?: string;
  description: string;
}

export interface FileItem {
  id: string;
  path: string;
  nodeId: string;
  content: string;
  isModified: boolean;
  type: 'code' | 'doc' | 'test' | 'config' | 'asset';
  sizeBytes: number;
  hash: string;
}

export interface SimulationResult {
  totalNodes: number;
  rebuiltNodes: string[];
  cachedNodes: string[];
  cacheHitRatio: number;
  naiveBuildTimeSec: number;
  smartBuildTimeSec: number;
  timeSavedSec: number;
  timeSavedPercent: number;
  carbonSavedGrams: number;
  computeCostSavedDollars: number;
  timestamp: string;
  invalidationReason: string;
}

export interface LabStep {
  stepNumber: number;
  title: string;
  shortDesc: string;
  objective: string;
  conceptBreakdown: string[];
  formula?: string;
  codeSnippet: {
    language: string;
    filename: string;
    code: string;
  };
  keyTakeaways: string[];
  quizQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  completed: boolean;
}

export interface RepoFile {
  path: string;
  description: string;
  language: string;
  content: string;
}
