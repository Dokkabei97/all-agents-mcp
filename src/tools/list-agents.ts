import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllRegisteredAgents } from "../agents/registry.js";

export function registerListAgentsTool(server: McpServer): void {
	server.tool(
		"list_agents",
		"List all detected agents and their availability status.",
		{},
		async () => {
			const agents = getAllRegisteredAgents();

			const checks = await Promise.all(
				agents.map(async (agent) => ({
					id: agent.id,
					displayName: agent.displayName,
					cliCommand: agent.cliCommand,
					available: await agent.isAvailable(),
					defaultModel: agent.getDefaultModel(),
					modelCount: agent.getModels().length,
				})),
			);

			const lines = ["## Available Agents\n"];
			for (const check of checks) {
				const status = check.available ? "Available" : "Not installed";
				lines.push(`### ${check.displayName} (\`${check.id}\`)`);
				lines.push(`- **Status**: ${status}`);
				lines.push(`- **CLI**: \`${check.cliCommand}\``);
				lines.push(`- **Default Model**: ${check.defaultModel}`);
				lines.push(`- **Models**: ${check.modelCount} available`);
				lines.push("");
			}

			return {
				content: [{ type: "text" as const, text: lines.join("\n") }],
			};
		},
	);
}
