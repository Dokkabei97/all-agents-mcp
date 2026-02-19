---
name: agents
description: Show all AI agents status — availability, health, and configuration
---

# Agents Status

User wants to see the status of all available AI agents.

## Instructions

1. Call both MCP tools in sequence:

   a. First, call `mcp__all-agents-mcp__list_agents` (no parameters) to get agent list and availability.

   b. Then, call `mcp__all-agents-mcp__agent_health` (no parameters) to get health status including authentication and latency.

2. Combine and present the results in a unified view showing:
   - Agent name and ID
   - Availability status
   - Authentication status
   - Latency
   - Default model and available model count

## Example

- `/all-agents-mcp:agents` — show all agents and their current status
