#!/usr/bin/env bash
# All-Agents-MCP: Setup verification script
# Runs on SessionStart to verify prerequisites

set -euo pipefail

warnings=()
info=()

# Check Node.js version
if command -v node &>/dev/null; then
	node_version=$(node -v | sed 's/v//')
	major_version=$(echo "$node_version" | cut -d. -f1)
	if [ "$major_version" -lt 22 ]; then
		warnings+=("Node.js $node_version detected — version 22+ is required for all-agents-mcp")
	fi
else
	warnings+=("Node.js not found — required for all-agents-mcp MCP server")
fi

# Check AI CLI agents
agents_found=0
agent_list=()

if command -v codex &>/dev/null; then
	agents_found=$((agents_found + 1))
	agent_list+=("codex")
fi

if command -v gemini &>/dev/null; then
	agents_found=$((agents_found + 1))
	agent_list+=("gemini")
fi

if command -v copilot &>/dev/null; then
	agents_found=$((agents_found + 1))
	agent_list+=("copilot")
fi

if [ "$agents_found" -eq 0 ]; then
	warnings+=("No AI CLI agents found. Install at least one: codex, gemini, or copilot")
else
	info+=("all-agents-mcp: ${agents_found} agent(s) available — ${agent_list[*]}")
fi

# Output warnings
for w in "${warnings[@]+"${warnings[@]}"}"; do
	[ -n "$w" ] && echo "[all-agents-mcp] WARNING: $w"
done

# Output info
for i in "${info[@]+"${info[@]}"}"; do
	[ -n "$i" ] && echo "[all-agents-mcp] $i"
done
