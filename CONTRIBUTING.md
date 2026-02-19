# Contributing to All-Agents-MCP

Thank you for your interest in contributing to All-Agents-MCP! This guide will help you get started.

## Getting Started

### Development Environment Setup

```bash
# 1. Fork & clone the repository
git clone https://github.com/<your-username>/all-agents-mcp.git
cd all-agents-mcp

# 2. Install dependencies (Node.js 22+ required)
npm install

# 3. Build
npm run build

# 4. Run tests
npm test
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | TypeScript compilation (`dist/`) |
| `npm run dev` | Watch mode compilation |
| `npm run lint` | Biome lint + auto-fix |
| `npm run lint:check` | Biome lint (check only, for CI) |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode tests |

## How to Contribute

### Bug Reports

Please use the [Bug Report issue template](https://github.com/Dokkabei97/all-agents-mcp/issues/new?template=bug_report.yml).

Include the following information:
- Steps to reproduce
- Expected behavior vs actual behavior
- Node.js version, OS, and installed agent CLIs

### Feature Requests

Please use the [Feature Request issue template](https://github.com/Dokkabei97/all-agents-mcp/issues/new?template=feature_request.yml).

### Pull Requests

1. **Issue first** — Please discuss large changes in an issue before submitting a PR.
2. **Create a branch** — Use `feature/description` or `fix/description` format.
3. **Implement changes** — Follow the code conventions below.
4. **Add tests** — Include tests for new features or bug fixes.
5. **Ensure CI passes** — `npm run lint:check && npm run build && npm test`
6. **Create PR** — Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

## Code Conventions

### Style

- **Formatter/Linter**: [Biome](https://biomejs.dev/) — auto-fix with `npm run lint`
- **Indentation**: Tabs
- **Line width**: 100 characters
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Always
- **Modules**: ESM only (`import`/`export`, `.js` extension required)

### Structural Principles

- File length under 300 lines, function length under 50 lines
- Adding new dependencies requires prior approval
- Never write to stdout — it breaks the MCP protocol. Use `logger` (stderr) only

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new agent support
fix: handle Codex timeout correctly
docs: update README installation guide
refactor: improve executor error handling
test: add complexity analyzer tests
chore: configure CI workflow
```

## Key Contribution Guides

### Adding a New Agent

1. `src/agents/{name}-agent.ts` — Extend `BaseAgent`
2. `src/agents/types.ts` — Add to the `AgentId` union type
3. `src/config/loader.ts` — Add defaults to `DEFAULT_CONFIG`
4. `src/agents/registry.ts` — Register factory in `agentFactories`
5. `src/utils/detect.ts` — Add caller detection in `CALLER_ENV_MAP` + `process.env._` check

### Adding a New Tool

1. `src/tools/{tool-name}.ts` — Export `register{Name}Tool(server)` function
2. Define Zod schema + implement handler + record session entry
3. `src/server.ts` — Import and call the registration function

## Questions?

- Feel free to ask questions or start discussions in [GitHub Issues](https://github.com/Dokkabei97/all-agents-mcp/issues).
- This project follows the [AIDE v1.0](./AIDE-REFERENCE.md) methodology. Please refer to it when contributing.

## License

All contributions are released under the project's [MIT License](./LICENSE).
