# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

all-agents-mcp is a stdio-based MCP server that orchestrates multiple AI CLI agents (Claude Code, Codex, Gemini CLI, Copilot CLI) through a unified interface. Exposes 14 tools and 3 resources.

**Development methodology**: This project follows [AIDE (Agent-Informed Development Engineering) v1.0](./AIDE-REFERENCE.md) — a software development methodology for the agentic era. See `AIDE-REFERENCE.md` for the full reference. Key adopted principles noted below with `[AIDE P#]` tags.

## Build & Development Commands

```bash
npm run build        # TypeScript compilation (tsc → dist/)
npm run dev          # Watch mode (tsc --watch)
npm run lint         # Biome check with auto-fix (biome check --write .)
npm test             # Run all tests (vitest run)
npm run test:watch   # Watch mode tests (vitest)
npx vitest run src/path/to/file.test.ts  # Run a single test file
```

Debug logging: `AA_MCP_LOG_LEVEL=debug node dist/index.js` (levels: debug, info, warn, error)

## Architecture

### Entry Flow

`src/index.ts` → `createServer()` in `src/server.ts` → registers all tools/resources → connects `StdioServerTransport`.

### Layer Structure [AIDE P2: Locality]

```
src/
├── agents/         # Agent abstraction — IAgent interface + per-agent implementations
├── orchestrator/   # Process spawning, parallel execution, complexity analysis, verification
├── tools/          # 14 MCP tool definitions (one file = one tool)
├── resources/      # 3 MCP resource definitions
├── session/        # File-based JSON session storage (~/.all-agents-mcp/sessions/)
├── config/         # Env var config loader (AA_MCP_* overrides) + Zod schema
├── utils/          # Logger (stderr-only), CLI detection
├── server.ts       # McpServer factory — registers all tools and resources
└── index.ts        # Entry point — stdio transport connection
```

### Agent Layer (`src/agents/`)

- **`types.ts`**: `AgentId = "claude" | "codex" | "gemini" | "copilot"`. Core interfaces: `IAgent`, `AgentResponse`, `HealthStatus`, `ExecutionOptions`, `AgentConfig`.
- **`base-agent.ts`**: Abstract class implementing `IAgent`. Subclasses implement `buildSpawnOptions()` to construct CLI-specific arguments. Delegates execution to `spawnAgent()` from the orchestrator.
- **Agent-specific overrides**: `CodexAgent` overrides `execute()` entirely (uses temp file via `--output-last-message`). `ClaudeAgent` overrides `parseOutput()` (JSON output format).
- **`registry.ts`**: Lazy-initialized singleton `Map<AgentId, IAgent>`. Applies **recursive call prevention** — detects the caller agent via `detectCaller()` and excludes it from the registry.

### Orchestrator Layer (`src/orchestrator/`)

- **`executor.ts`**: `spawnAgent()` — low-level `child_process.spawn` with `AbortController` timeout. All CLI invocations go through here.
- **`parallel.ts`**: `Promise.allSettled` for concurrent multi-agent execution.
- **`complexity.ts`**: Keyword-based heuristic (Korean + English) to classify tasks as `simple | complex | large` for `delegate_task`.
- **`verifier.ts`**: Cross-model verification — one agent, multiple models.
- **`aggregator.ts`**: Markdown formatting for responses — comparison tables, verification summaries.

### Tool Registration Pattern

Each file in `src/tools/` exports a `register*Tool(server: McpServer)` function:
```typescript
server.tool(name, description, zodSchema, async (params) => { ... })
```
All tools record interactions to the session store via `addEntry()`.

## Key Patterns & Constraints

- **ESM-only**: `"type": "module"`. All imports use `.js` extension (Node16 module resolution). [AIDE P7]
- **Biome formatting**: Tab indentation, 100 char line width, double quotes, semicolons always.
- **MCP stdout constraint**: Never write to stdout except via MCP SDK. All logging uses stderr via `logger`. This is the most critical invariant — violating it breaks the MCP protocol.
- **Recursion guard**: The registry auto-excludes the caller agent (detected via CLI args → env vars → `process.env._`). This prevents infinite loops when all-agents-mcp is invoked from within an agent it orchestrates.
- **Model config**: 에이전트별 모델 설정은 `src/config/models.json`에 정의. 신규 모델 추가 시 JSON만 편집 → `npm run build` → publish. 환경 변수 오버라이드(`AA_MCP_*`)는 그대로 유지.
- **Tests**: Vitest tests are co-located alongside source as `*.test.ts`. Run with `npm test`.

## AIDE Methodology Reference [AIDE P10: Meta-Code as First-Class]

This project adopts AIDE v1.0. The full reference is in [`AIDE-REFERENCE.md`](./AIDE-REFERENCE.md). Key principles applied:

| Principle | Application in this project |
|-----------|----------------------------|
| **P1 Context Budget** | Files ≤300 lines, functions ≤50 lines, line width 100 chars |
| **P2 Locality** | Each tool is a self-contained file. Agent implementations are co-located |
| **P3 Functional Core** | Orchestrator functions are pure where possible. Classes only for agent infrastructure |
| **P5 Test as Spec** | Vitest configured. TDD for deterministic logic (complexity scoring, detection) |
| **P6 Progressive Disclosure** | CLAUDE.md (Tier 1, always loaded) → feature AGENTS.md (Tier 2, lazy) |
| **P7 Deterministic Guardrails** | TypeScript strict + Biome lint + Zod schema validation |
| **P10 Meta-Code** | CLAUDE.md and AIDE-REFERENCE.md are version-controlled artifacts |

When adding new features, follow the AIDE workflow: types → logic → tests → handler → verify.

## External Dependencies (non-dev)

- `@modelcontextprotocol/sdk` — MCP server SDK
- `which` — CLI binary detection
- `zod` — Schema validation for tool inputs and config

Do NOT add new dependencies without explicit approval. [AIDE P7]

## Adding a New Agent

1. Create `src/agents/{name}-agent.ts` extending `BaseAgent`
2. Add the agent ID to the `AgentId` union type in `src/agents/types.ts`
3. Add agent defaults to `src/config/models.json`
4. Register the factory in `src/agents/registry.ts` `agentFactories`
5. Add caller detection in `src/utils/detect.ts` (`CALLER_ENV_MAP` + `process.env._` check)

## Adding a New Tool

1. Create `src/tools/{tool-name}.ts` with `export function register{Name}Tool(server: McpServer)`
2. Define Zod schema, implement handler, record session entry
3. Register in `src/server.ts` — import and call the registration function

