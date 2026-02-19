---
name: delegate
description: Delegate a task with automatic complexity analysis — routes to single or parallel agents
argument-hint: <task description>
---

# Delegate Task

User wants to delegate a task with automatic complexity-based routing.

## Instructions

1. Parse the user's input to extract the **task description**.
   - Everything after the skill invocation is the task
   - If no task is provided, ask the user what task to delegate

2. Call the MCP tool `mcp__all-agents-mcp__delegate_task` with:
   - `task`: the task description
   - `agent` (optional): if the user specifies a preferred agent, pass it
   - `allowParallel`: default `true` — set to `false` only if the user explicitly asks for single-agent execution
   - `context` (optional): include relevant code or context from the conversation

3. Display the result as-is. The tool automatically:
   - Analyzes task complexity (simple/complex/large)
   - Routes simple/complex tasks to a single agent
   - Splits large tasks across multiple agents in parallel
   - Returns complexity analysis + agent response(s)

## Examples

- `/all-agents-mcp:delegate Write unit tests for the authentication module`
- `/all-agents-mcp:delegate Refactor this class to use dependency injection`
