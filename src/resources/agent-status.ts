import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllRegisteredAgents } from "../agents/registry.js";

export function registerAgentStatusResource(server: McpServer): void {
	server.resource("agent-status", "aa://agents/status", async (uri) => {
		const agents = getAllRegisteredAgents();

		const statuses = await Promise.all(
			agents.map(async (agent) => ({
				id: agent.id,
				displayName: agent.displayName,
				available: await agent.isAvailable(),
				defaultModel: agent.getDefaultModel(),
				models: agent.getModels(),
			})),
		);

		return {
			contents: [
				{
					uri: uri.href,
					mimeType: "application/json",
					text: JSON.stringify(statuses, null, 2),
				},
			],
		};
	});
}
