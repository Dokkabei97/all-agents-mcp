---
name: review
description: Request a code review from an external AI agent
argument-hint: <agent> [focus]
disable-model-invocation: true
---

# Code Review

User wants an external AI agent to review code.

## Instructions

1. Parse the user's input to extract:
   - **agent**: the agent to use (`codex`, `gemini`, or `copilot`)
   - **focus** (optional): `bugs`, `security`, `performance`, or `clarity`
   - If no agent is specified, ask the user which agent to use

2. Gather the code to review:
   - If the user referenced a specific file, read it and use as the `code` parameter
   - If code was provided inline in the conversation, use that
   - If no code context is available, ask the user what code to review

3. Call the MCP tool `mcp__all-agents-mcp__review_code` with:
   - `agent`: target agent ID
   - `code`: the code content to review
   - `filePath` (optional): the file path for context
   - `focus` (optional): specific review focus area

4. Display the review result as-is.

## Examples

- `/all-agents-mcp:review codex security` — review current code with Codex focusing on security
- `/all-agents-mcp:review gemini` — general review with Gemini
