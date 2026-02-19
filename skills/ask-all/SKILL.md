---
name: ask-all
description: Ask all available AI agents the same question in parallel and compare responses
argument-hint: <question>
---

# Ask All Agents

User wants to get parallel responses from all available AI agents for comparison.

## Instructions

1. Parse the user's input to extract the **question**.
   - Everything after the skill invocation is the question/prompt
   - If no question is provided, ask the user what they want to ask

2. Call the MCP tool `mcp__all-agents-mcp__ask_all` with:
   - `prompt`: the user's question
   - `context` (optional): if there's relevant code or context in the conversation, include it

3. Display the comparison result as-is. The tool returns a formatted markdown comparison table showing each agent's response, duration, and model used.

## Examples

- `/all-agents-mcp:ask-all How should I structure a REST API for a todo app?`
- `/all-agents-mcp:ask-all What's the best way to handle errors in TypeScript?`
