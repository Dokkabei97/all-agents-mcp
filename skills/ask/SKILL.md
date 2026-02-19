---
name: ask
description: Ask a specific AI agent (codex, gemini, copilot) a question
argument-hint: <agent> <question>
---

# Ask Agent

User wants to ask a specific AI agent a question.

## Instructions

1. Parse the user's input to extract the **agent name** and **question**.
   - The first word after the skill invocation is the agent: `codex`, `gemini`, or `copilot`
   - Everything after the agent name is the question/prompt
   - If no agent is specified, ask the user which agent to use

2. Call the MCP tool `mcp__all-agents-mcp__ask_agent` with:
   - `agent`: the target agent ID (`codex`, `gemini`, or `copilot`)
   - `prompt`: the user's question
   - `model` (optional): if the user specifies a model, pass it
   - `context` (optional): if there's relevant code or context in the conversation, include it

3. Display the response as-is. The tool returns formatted markdown.

## Examples

- `/all-agents-mcp:ask codex How do I implement a binary search in Python?`
- `/all-agents-mcp:ask gemini Explain the difference between async and sync`
- `/all-agents-mcp:ask copilot Review this function for performance issues`
