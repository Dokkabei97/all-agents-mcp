# Code Style & Conventions

## Formatting (Biome)
- Tab indentation
- 100 char line width
- Double quotes
- Semicolons always

## Naming (TypeScript native convention - AIDE Language-Native Convention First)
- Functions: camelCase
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Classes: PascalCase
- Class methods: camelCase
- Types/Interfaces: PascalCase

## Imports
- ESM-only with `.js` extension for all local imports
- Node16 module resolution

## Patterns
- One tool per file in src/tools/
- Tools export `register*Tool(server: McpServer)` function
- Agent implementations extend BaseAgent
- All logging via stderr (logger utility)
