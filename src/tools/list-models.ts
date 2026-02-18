import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent, getAllRegisteredAgents } from "../agents/registry.js";

const SCHEMA = {
	agent: z
		.enum(["claude", "codex", "gemini", "copilot"])
		.optional()
		.describe("Specific agent to list models for (all agents if omitted)"),
};

export function registerListModelsTool(server: McpServer): void {
	server.tool(
		"list_models",
		"List available models for agents. Optionally filter by specific agent.",
		SCHEMA,
		async (params) => {
			const lines = ["## Available Models\n"];

			if (params.agent) {
				const agent = getAgent(params.agent);
				if (!agent) {
					return {
						content: [{ type: "text" as const, text: `Agent '${params.agent}' is not available.` }],
					};
				}

				lines.push(`### ${agent.displayName}`);
				lines.push(`Default: **${agent.getDefaultModel()}**\n`);
				for (const model of agent.getModels()) {
					const isDefault = model === agent.getDefaultModel() ? " (default)" : "";
					lines.push(`- ${model}${isDefault}`);
				}
			} else {
				const agents = getAllRegisteredAgents();
				for (const agent of agents) {
					lines.push(`### ${agent.displayName} (\`${agent.id}\`)`);
					lines.push(`Default: **${agent.getDefaultModel()}**\n`);
					for (const model of agent.getModels()) {
						const isDefault = model === agent.getDefaultModel() ? " (default)" : "";
						lines.push(`- ${model}${isDefault}`);
					}
					lines.push("");
				}
			}

			return {
				content: [{ type: "text" as const, text: lines.join("\n") }],
			};
		},
	);
}
