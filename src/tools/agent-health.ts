import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent, getAllRegisteredAgents } from "../agents/registry.js";
import type { AgentId } from "../agents/types.js";

const SCHEMA = {
	agent: z
		.enum(["claude", "codex", "gemini", "copilot"])
		.optional()
		.describe("Specific agent to check (all agents if omitted)"),
};

export function registerAgentHealthTool(server: McpServer): void {
	server.tool(
		"agent_health",
		"Check agent health status including availability, authentication, and latency.",
		SCHEMA,
		async (params) => {
			const agents = params.agent
				? [getAgent(params.agent)].filter(Boolean)
				: getAllRegisteredAgents();

			if (agents.length === 0) {
				return {
					content: [{ type: "text" as const, text: "No agents to check." }],
				};
			}

			// biome-ignore lint/style/noNonNullAssertion: filtered above
			const results = await Promise.all(agents.map((agent) => agent!.healthCheck()));

			const lines = ["## Agent Health Status\n"];

			for (const status of results) {
				const icon = status.available && status.authenticated ? "OK" : "ISSUE";
				lines.push(`### ${status.agent} [${icon}]`);
				lines.push(`- **Available**: ${status.available}`);
				lines.push(`- **Authenticated**: ${status.authenticated}`);
				if (status.latencyMs != null) {
					lines.push(`- **Latency**: ${status.latencyMs}ms`);
				}
				if (status.error) {
					lines.push(`- **Error**: ${status.error}`);
				}
				lines.push("");
			}

			return {
				content: [{ type: "text" as const, text: lines.join("\n") }],
			};
		},
	);
}
