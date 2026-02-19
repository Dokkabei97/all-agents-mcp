---
name: debug
description: Debug an error using an external AI agent
argument-hint: <agent> <error message>
disable-model-invocation: true
---

# Debug with Agent

User wants to debug an error using an external AI agent.

## Instructions

1. Parse the user's input to extract:
   - **agent**: the agent to use (`codex`, `gemini`, or `copilot`)
   - **error**: the error message or description
   - If no agent is specified, ask the user which agent to use

2. Gather additional context:
   - If there's relevant code in the conversation, include it as `code`
   - If there's a stack trace or logs, include as `context`

3. Call the MCP tool `mcp__all-agents-mcp__debug_with` with:
   - `agent`: target agent ID
   - `error`: the error message
   - `code` (optional): relevant code context
   - `context` (optional): stack trace, logs, or other context

4. Display the debug analysis as-is. The response includes root cause analysis, fix steps, and prevention recommendations.

## Examples

- `/all-agents-mcp:debug codex TypeError: Cannot read property 'map' of undefined`
- `/all-agents-mcp:debug gemini ECONNREFUSED when connecting to database`
