import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Initialize Google Gen AI client with telemetry header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-4-argon',
      thinkingLevel: 'HIGH',
      timestamp: new Date().toISOString(),
    });
  });

  // High-Thinking Build-Cache Architectural Analysis
  app.post('/api/ai/analyze-cache', async (req: Request, res: Response) => {
    try {
      const {
        scenarioTitle,
        systemType,
        changedFiles,
        dagNodes,
        currentCacheStrategy,
        customQuery,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in server environment.',
        });
      }

      const prompt = `You are a Principal Build Infrastructure & CI/CD Engineer specializing in Smart Build-Cache Invalidation, Content-Addressable Storage (CAS), Merkle DAG hashing, and Hermetic Builds for modern software systems.

Analyze this build caching scenario:
- **System / Architecture**: ${systemType || 'Distributed Monorepo with Microservices'}
- **Scenario**: ${scenarioTitle || 'Selective Code Change'}
- **Changed Files**: ${JSON.stringify(changedFiles || [], null, 2)}
- **DAG Nodes & Dependencies**: ${JSON.stringify(dagNodes || [], null, 2)}
- **Current Strategy**: ${currentCacheStrategy || 'Content-Addressable Invalidation'}
- **User Specific Investigation**: ${customQuery || 'Perform full invalidation analysis, detect false cache hits vs unnecessary rebuilds, and provide mathematical cache key hashing logic.'}

Provide an exhaustive, senior-architect level analysis covering:
1. **Root-Cause Invalidation Boundary**: Exactly which targets MUST be invalidated and which targets MUST safely hit cache.
2. **Hidden Invalidation Vectors & Cache Poisoning Risks**: Identify subtle hazards (e.g. non-deterministic timestamps, unpinned transitive dependencies, OS/glibc drift, environment variable leaks).
3. **Smart Hashing & Merkle Key Specification**: Formulate the exact mathematical hash equation \`H(target) = SHA256(H_inputs + H_deps + H_env + H_toolchain)\` tailored to this graph.
4. **Concrete Optimization Action Plan**: Step-by-step guidance for students/engineers to implement in CI/CD (GitHub Actions, Turborepo, Bazel, or Docker BuildKit).`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an authoritative expert in Automation in Software Development, Cloud DevOps, and Build Systems. Provide rigorous, highly technical, and educational reasoning.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        analysis: response.text,
        model: 'gemini-4-argon',
        thinkingLevel: 'HIGH',
      });
    } catch (err: any) {
      console.error('Error during AI cache analysis:', err);
      res.status(500).json({
        error: err.message || 'Failed to execute high-thinking cache analysis.',
      });
    }
  });

  // High-Thinking Assignment Document & Learnings Generator
  app.post('/api/ai/generate-learning-doc', async (req: Request, res: Response) => {
    try {
      const {
        studentName,
        rollNumber,
        courseName,
        instructorName,
        completedSteps,
        simulationResults,
        userReflections,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in server environment.',
        });
      }

      const prompt = `Generate a high-scoring, thorough, academic and industrial-grade Assignment Submission Document on the topic: "Smart Build-Cache Invalidation".

Course Context:
- Course: ${courseName || 'Automation in Software Development (CSE - AIDD A SEM V 2026-27 / Cloud DevOps / MLOps)'}
- Instructor: ${instructorName || 'Munukuntla Shiva Prasad'}
- Student Name: ${studentName || 'Student'}
- Roll Number: ${rollNumber || '2026-AIDD-042'}
- Assignment: Assignment 4.2 - Smart Build-Cache Invalidation

Requirements specified by the Professor:
"submit GitHub repo link and document of your learnings from the assignment. In document add each step and describe properly."

Included Experimental Context:
- Completed Steps: ${JSON.stringify(completedSteps || [], null, 2)}
- Simulation / Benchmark Metrics: ${JSON.stringify(simulationResults || {}, null, 2)}
- Student Observations / Notes: ${userReflections || 'Understood Merkle DAG hashing and selective invalidation.'}

The document MUST contain:
# Title: Assignment 4.2: Comprehensive Study and Implementation of Smart Build-Cache Invalidation
## 1. Executive Summary & Problem Formulation (Why Naive Caching Fails: Cache Poisoning vs 0% Hit Rates)
## 2. Theoretical Foundations (Merkle Trees, Content-Addressable Storage CAS, Directed Acyclic Graphs, Hermeticity)
## 3. Step-by-Step Implementation Guide (Describe every single step properly with CLI commands, code snippets, hashing algorithms, and verification):
  - Step 1: Input Tree Fingerprinting & AST Normalization
  - Step 2: Dependency DAG Construction & Topological Invalidation Traversal
  - Step 3: Multi-Tiered Cache Key Formulation & Environment Sanitization
  - Step 4: Distributed Remote Cache Orchestration (GitHub Actions & Object Stores)
  - Step 5: Hermetic Sandboxing & Cache Poisoning Defense
## 4. Experimental Benchmarks & Metrics (Cache Hit Ratio, CI Time Speedup, Compute & Carbon Reduction)
## 5. Docker & Container Layer Cache Optimization (Layer ordering, BuildKit cache mounts)
## 6. Personal Learnings & Key Takeaways
## 7. Verification & GitHub Repository Structure

Ensure every step is described with extreme precision, clear formatting, and industrial rigor.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an esteemed Professor of Software Automation and Cloud DevOps. Generate a polished, publication-quality student learning document formatted in crisp Markdown with deep technical clarity.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        document: response.text,
        model: 'gemini-4-argon',
        thinkingLevel: 'HIGH',
      });
    } catch (err: any) {
      console.error('Error generating learning document:', err);
      res.status(500).json({
        error: err.message || 'Failed to generate assignment learning document.',
      });
    }
  });

  // High-Thinking Dockerfile & Pipeline Cache Auditor
  app.post('/api/ai/docker-audit', async (req: Request, res: Response) => {
    try {
      const { dockerfileContent, ciPipelineContent } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in server environment.',
        });
      }

      const prompt = `Perform a high-level build cache audit on this Dockerfile and CI configuration:

\`\`\`dockerfile
${dockerfileContent || '# Default Dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nRUN npm run build\nCMD ["npm", "start"]'}
\`\`\`

\`\`\`yaml
${ciPipelineContent || '# GitHub Actions sample\nname: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install && npm test'}
\`\`\`

Analyze:
1. Every line that causes premature or unnecessary cache invalidation.
2. Missing \`.dockerignore\` filters and layer ordering mistakes.
3. Rewrite the Dockerfile with BuildKit cache mounts (\`--mount=type=cache,target=...\`), multi-stage separation, and minimal root layers.
4. Provide the exact GitHub Actions caching configuration (\`actions/cache\` with hashFiles).`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a Docker BuildKit and CI/CD caching architect. Provide step-by-step diagnostic breakdown and optimized configurations.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        auditReport: response.text,
        model: 'gemini-4-argon',
        thinkingLevel: 'HIGH',
      });
    } catch (err: any) {
      console.error('Error auditing Dockerfile/CI cache:', err);
      res.status(500).json({
        error: err.message || 'Failed to audit Dockerfile build cache.',
      });
    }
  });

  // Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Build-Cache Invalidation Studio server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
