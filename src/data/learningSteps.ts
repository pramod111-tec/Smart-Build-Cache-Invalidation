import { LabStep } from '../types';

export const assignmentSteps: LabStep[] = [
  {
    stepNumber: 1,
    title: 'Content-Addressable Hashing & Input Tree Fingerprinting',
    shortDesc: 'Compute deterministic SHA-256 Merkle hashes for source files while filtering non-functional noise.',
    objective:
      'Learn how modern build engines (Bazel, Turborepo, Gradle) replace brittle mtime timestamps with Content-Addressable Storage (CAS) hashes, normalizing line endings and ignoring markdown/documentation edits.',
    conceptBreakdown: [
      'Timestamp (mtime) fallacy: Git does not preserve file timestamps across clones, causing naive tools like Make to trigger 100% false rebuilds on every fresh CI runner.',
      'Merkle Tree input hashing: Every source file is hashed via SHA-256. Directory hashes are the cryptographic root of sorted child hashes.',
      'AST & Content Normalization: Stripping comments, whitespace, and formatting prevents cosmetic PRs from invalidating expensive compiled binaries.',
      'Non-functional filter: Filtering documentation (*.md, docs/*, .gitignore) from the compilation key ensures zero-cost doc updates.',
    ],
    formula: 'H_{target} = SHA256\\left( \\bigoplus_{f \\in Inputs} SHA256(f_{content}) \\right)',
    codeSnippet: {
      language: 'typescript',
      filename: 'src/cas-hasher.ts',
      code: `import crypto from 'crypto';
import fs from 'fs';

export function hashFileContent(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Normalize CRLF to LF and trim trailing whitespace
  const normalized = content.replace(/\\r\\n/g, '\\n').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function computeMerkleDirectoryHash(fileHashes: Record<string, string>): string {
  // Sort keys deterministically to avoid unordered hash drift
  const sortedKeys = Object.keys(fileHashes).sort();
  const hasher = crypto.createHash('sha256');
  for (const key of sortedKeys) {
    hasher.update(\`\${key}:\${fileHashes[key]}\`);
  }
  return hasher.digest('hex');
}`,
    },
    keyTakeaways: [
      'Never rely on file modification timestamps in CI/CD environments.',
      'Always sort file manifests before hashing to guarantee deterministic root hashes.',
      'Separate doc-only changes using path filters (.dockerignore, turbo.json inputs).',
    ],
    quizQuestion: {
      question: 'Why does git clone in CI break timestamp-based build cache systems (like standard GNU Make)?',
      options: [
        'Git sets the mtime of all checked-out files to the current checkout time, marking every file as newly modified.',
        'Git encrypts the file timestamps using an unreadable hash.',
        'Timestamps can only be read on Linux, not macOS.',
        'Make requires network access to verify file times.',
      ],
      correctIndex: 0,
      explanation:
        'Correct! Git checkout creates files with the current system time, so Make thinks all files were modified 1 second ago and recompiles the entire universe. Content-addressable hashing solves this by hashing file bytes.',
    },
    completed: true,
  },
  {
    stepNumber: 2,
    title: 'Dependency DAG Modeling & Topological Invalidation Traversal',
    shortDesc: 'Construct the Directed Acyclic Graph to calculate the exact impact radius of modified packages.',
    objective:
      'Understand how monorepo task graph managers traverse reverse dependencies using Depth-First Search (DFS) to rebuild ONLY affected downstream nodes while keeping unaffected branches cached.',
    conceptBreakdown: [
      'Directed Acyclic Graph (DAG): Nodes represent packages or tasks (build, test, lint), and edges represent import/link dependencies.',
      'Impact Radius / Downstream Propagation: If package A changes, all packages that directly or transitively depend on A must be marked DIRTY.',
      'Branch Hermeticity: If package B does not import A or any of A’s dependents, B’s cache key remains strictly unchanged (100% Cache Hit).',
      'Topological Sorting: Rebuilding dirty targets in dependency order guarantees that downstream targets consume freshly compiled artifacts.',
    ],
    formula: 'DirtyTargets = \\{ u \\in V \\mid \\exists v \\in ChangedNodes : u \\rightsquigarrow v \\}',
    codeSnippet: {
      language: 'typescript',
      filename: 'src/dag-resolver.ts',
      code: `export interface Node {
  id: string;
  dependencies: string[];
}

export function findImpactRadius(nodes: Node[], changedNodeIds: string[]): Set<string> {
  const dirty = new Set<string>(changedNodeIds);
  let grew = true;

  // Build reverse dependency lookup: parent -> dependent children
  while (grew) {
    const prevSize = dirty.size;
    for (const node of nodes) {
      if (!dirty.has(node.id)) {
        // If this node depends on any node that is currently dirty, it becomes dirty too
        const dependsOnDirty = node.dependencies.some(depId => dirty.has(depId));
        if (dependsOnDirty) {
          dirty.add(node.id);
        }
      }
    }
    grew = dirty.size > prevSize;
  }
  return dirty;
}`,
    },
    keyTakeaways: [
      'A change in a leaf package (e.g. frontend button) should never trigger recompilation of independent backend or ML services.',
      'Reverse-dependency traversal provides mathematical proof of what needs rebuilding.',
      'Eliminate circular dependencies to maintain a valid acyclic execution graph.',
    ],
    quizQuestion: {
      question: 'If package "auth-service" depends on "core-utils", and you modify a file in "web-frontend" (which depends on "ui-tokens"), does "auth-service" rebuild?',
      options: [
        'No, because auth-service has zero dependency path to web-frontend or ui-tokens.',
        'Yes, because all monorepos always rebuild all services on git push.',
        'Yes, because auth-service uses more RAM.',
        'Only if the commit message contains [rebuild].',
      ],
      correctIndex: 0,
      explanation:
        'Correct! In a DAG-aware smart build system, auth-service is completely independent of web-frontend and ui-tokens, so its cache hit is preserved, saving compilation time.',
    },
    completed: true,
  },
  {
    stepNumber: 3,
    title: 'Multi-Factor Cache Key Formulation & Environment Sanitization',
    shortDesc: 'Formulate robust composite cache keys containing compiler toolchain, OS architecture, and env vars.',
    objective:
      'Formulate holistic cache keys that prevent "phantom bugs" (where code did not change, but compiler version or production env flags changed).',
    conceptBreakdown: [
      'The Cache Key Tuple: Key = SHA256(SourceContent + TransitiveDepKeys + ToolchainVersion + EnvVars + TargetArch).',
      'Environment Variable Whitelisting: Blindly hashing process.env invalidates the cache on trivial variables like PWD or RANDOM. Only whitelist build-impacting vars (NODE_ENV, VITE_API_URL).',
      'Toolchain Drift: If Node.js changes from v18.1.0 to v20.5.0, or gcc changes from 11.2 to 12.1, binaries must be recompiled even if source code is identical.',
      'Cross-Platform Architecture Invalidation: Never share x86_64 and arm64 (Apple Silicon) native compiled binaries.',
    ],
    formula: 'Key = SHA256( H_{files} \\;\\Vert\\; H_{deps} \\;\\Vert\\; H_{env\\_whitelist} \\;\\Vert\\; H_{toolchain} )',
    codeSnippet: {
      language: 'typescript',
      filename: 'src/cache-key-generator.ts',
      code: `import crypto from 'crypto';

export interface CacheKeyInputs {
  targetId: string;
  sourceHash: string;
  depHashes: string[];
  envVars: Record<string, string>;
  toolchainVersion: string;
  arch: string;
}

export function generateSmartCacheKey(inputs: CacheKeyInputs): string {
  const hasher = crypto.createHash('sha256');
  hasher.update(\`target:\${inputs.targetId}|\`);
  hasher.update(\`src:\${inputs.sourceHash}|\`);
  hasher.update(\`deps:\${inputs.depHashes.sort().join(',')}|\`);
  
  // Whitelist build env vars
  const envManifest = Object.keys(inputs.envVars)
    .sort()
    .map(k => \`\${k}=\${inputs.envVars[k]}\`)
    .join(';');
  hasher.update(\`env:\${envManifest}|\`);
  hasher.update(\`tool:\${inputs.toolchainVersion}|\`);
  hasher.update(\`arch:\${inputs.arch}\`);
  
  return \`build-v1-\${inputs.targetId}-\${hasher.digest('hex').substring(0, 16)}\`;
}`,
    },
    keyTakeaways: [
      'A cache key that ignores compiler or node version will produce ABI incompatibilities and elusive production crashes.',
      'Always include target OS and architecture (linux-x64 vs darwin-arm64) in native build cache keys.',
      'Filter out non-deterministic environment variables like CI_JOB_ID or BUILD_TIMESTAMP.',
    ],
    quizQuestion: {
      question: 'What happens if your cache key includes $HOSTNAME or $RANDOM from the environment?',
      options: [
        'The cache will never hit across different CI runner machines, resulting in a 0% cache hit rate.',
        'The build will run twice as fast.',
        'Docker will automatically delete all old layers.',
        'The git commit hash will be corrupted.',
      ],
      correctIndex: 0,
      explanation:
        'Correct! Because $HOSTNAME or $RANDOM changes on every single runner execution, the computed cache key will be unique every time, completely destroying cache reuse.',
    },
    completed: true,
  },
  {
    stepNumber: 4,
    title: 'Distributed Remote Cache Synchronization (CI/CD & Cloud CAS)',
    shortDesc: 'Implement distributed read/write remote caching across GitHub Actions, S3, and developer workstations.',
    objective:
      'Learn how to scale build caching across team members and CI pipelines so a build artifact compiled once by a colleague or CI is instantly downloaded instead of re-executed.',
    conceptBreakdown: [
      'Two-Tier Caching Architecture: Tier 1 is Local NVMe SSD Cache (<5ms latency); Tier 2 is Remote Object Store / Redis CAS (~50ms latency).',
      'GitHub Actions Cache: Using actions/cache with restore-keys fallback patterns and hashFiles() functions.',
      'Read vs Write Access Control: Pull Requests from untrusted forks must have READ-ONLY cache access to prevent malicious cache poisoning.',
      'Compression vs Network Bandwidth: Compressing tarballs with Zstandard (zstd) gives the optimal balance of decompression speed and compression ratio.',
    ],
    formula: 'CI\\_Speedup = \\frac{T_{local\\_build}}{T_{CAS\\_download} + T_{unarchive}} \\approx 8\\times \\text{ to } 25\\times',
    codeSnippet: {
      language: 'yaml',
      filename: '.github/workflows/ci.yml',
      code: `name: Smart Caching CI Pipeline
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node & Rust Toolchains
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Restore Smart Build CAS
        uses: actions/cache@v4
        id: build-cas
        with:
          path: |
            .smart-cache
            dist
            node_modules/.cache
          key: \${{ runner.os }}-cas-\${{ hashFiles('**/package-lock.json', 'src/**/*.ts') }}
          restore-keys: |
            \${{ runner.os }}-cas-\${{ hashFiles('**/package-lock.json') }}
            \${{ runner.os }}-cas-

      - name: Execute Smart Incremental Build
        run: npm run smart-build`,
    },
    keyTakeaways: [
      'Remote caching turns CI build time from linear O(N) into constant O(changed_delta).',
      'Never allow unauthenticated PR runs to write to main branch remote cache.',
      'Leverage zstd compression for high-speed CAS artifact streaming.',
    ],
    quizQuestion: {
      question: 'Why is it a security vulnerability to allow external open-source PR contributors to write to your CI remote cache?',
      options: [
        'An attacker could submit a PR that alters a compiled binary in the cache, poisoning subsequent production builds with a backdoor.',
        'Because GitHub charges extra storage fees for forks.',
        'Because PRs do not have access to git bash.',
        'Because cloud object stores only accept binary files under 10KB.',
      ],
      correctIndex: 0,
      explanation:
        'Correct! Cache poisoning occurs when malicious code is saved under a legitimate cache key. Strict RBAC (read-only for PRs, write-only for authenticated main branch) is required.',
    },
    completed: true,
  },
  {
    stepNumber: 5,
    title: 'Hermetic Sandboxing, Determinism & Cache Poisoning Defense',
    shortDesc: 'Enforce reproducible builds, zero undeclared network dependencies, and sandbox verification.',
    objective:
      'Master the engineering principles of hermetic builds (Bazel/Nix style) where builds execute in isolated namespaces without uncontrolled network or system access.',
    conceptBreakdown: [
      'Hermeticity Definition: A build is hermetic if given the exact same input tree and toolchain, it produces byte-for-byte identical output regardless of machine, timezone, or network state.',
      'The "Undeclared Dependency" trap: A build script quietly curl-ing a floating version from the internet breaks cache validity when the remote server updates.',
      'Reproducible Builds & SOURCE_DATE_EPOCH: Clamping timestamps in compiled binaries, jars, and docker layers to a fixed epoch timestamp eliminates timestamp-induced hash mismatches.',
      'Sandboxed Execution: Utilizing Linux namespaces / containers without internet access during the compile phase guarantees hermetic compliance.',
    ],
    formula: 'Output(Inputs, Env) \\equiv Output(Inputs, Env) \\quad \\forall \\text{ machines, timestamps, networks}',
    codeSnippet: {
      language: 'bash',
      filename: 'scripts/verify-hermetic.sh',
      code: `#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Hermetic Determinism Verification ==="

# Force deterministic timestamp epoch
export SOURCE_DATE_EPOCH=1700000000
export LC_ALL=C
export TZ=UTC

# Build 1: In clean temporary directory A
mkdir -p /tmp/build-a
./smart-cache-cli build --out-dir /tmp/build-a/dist

# Build 2: In clean temporary directory B
mkdir -p /tmp/build-b
./smart-cache-cli build --out-dir /tmp/build-b/dist

# Verify byte-for-byte identity
DIFF_OUT=$(diff -r /tmp/build-a/dist /tmp/build-b/dist || true)

if [ -z "$DIFF_OUT" ]; then
  echo "✅ Hermeticity Verified! Byte-for-byte deterministic output confirmed."
else
  echo "❌ Non-deterministic build detected! Diff:"
  echo "$DIFF_OUT"
  exit 1
fi`,
    },
    keyTakeaways: [
      'Determinism is the foundation of trustworthy caching. A non-deterministic build produces cache bugs.',
      'Pin SOURCE_DATE_EPOCH to eliminate build-time timestamp variation in binaries.',
      'Block outbound network calls during compilation steps to ensure hermeticity.',
    ],
    quizQuestion: {
      question: 'What is the primary purpose of SOURCE_DATE_EPOCH in reproducible, cacheable builds?',
      options: [
        'To replace fluctuating current timestamps with a static unix timestamp so generated binaries are byte-for-byte identical across runs.',
        'To tell the compiler how long it is allowed to run before timing out.',
        'To configure the timezone of the server.',
        'To verify the student’s assignment due date.',
      ],
      correctIndex: 0,
      explanation:
        'Correct! Without SOURCE_DATE_EPOCH, compilers and archivers (like zip, tar, jar) embed the exact current second into the artifact, causing different hashes on every compilation.',
    },
    completed: true,
  },
];
