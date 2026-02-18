# all-agents-mcp Project Overview

## Purpose
stdio-based MCP server that orchestrates multiple AI CLI agents (Claude Code, Codex, Gemini CLI, Copilot CLI) through a unified interface. Exposes 13 tools and 3 resources.

## Tech Stack
- TypeScript (strict mode, ES2022 target)
- Node.js >= 22 (ESM-only, `"type": "module"`)
- MCP SDK (`@modelcontextprotocol/sdk`)
- Zod for schema validation
- Biome for linting/formatting
- Vitest for testing

## Project Structure
```
src/
├── agents/         # IAgent interface + per-agent implementations (BaseAgent, Claude, Codex, Gemini, Copilot)
├── orchestrator/   # Process spawning, parallel execution, complexity analysis, verification
├── tools/          # 13 MCP tool definitions (one file = one tool)
├── resources/      # 3 MCP resource definitions
├── session/        # File-based JSON session storage
├── config/         # YAML config loader + Zod schema
├── utils/          # Logger (stderr-only), CLI detection
├── server.ts       # McpServer factory
└── index.ts        # Entry point — stdio transport
config/
└── models.yaml     # External model config
```

## Key Constraints
- ESM-only: all imports use `.js` extension
- MCP stdout constraint: never write to stdout except via MCP SDK; all logging via stderr
- Recursion guard: registry auto-excludes caller agent
- AIDE methodology applied
