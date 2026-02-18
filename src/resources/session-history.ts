import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../session/store.js";

export function registerSessionHistoryResource(server: McpServer): void {
	server.resource(
		"session-history",
		new ResourceTemplate("aa://session/{id}/history", { list: undefined }),
		async (uri, params) => {
			const sessionId = params.id as string;
			const session = getSession(sessionId);

			if (!session) {
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify({ error: "Session not found" }),
						},
					],
				};
			}

			return {
				contents: [
					{
						uri: uri.href,
						mimeType: "application/json",
						text: JSON.stringify(session, null, 2),
					},
				],
			};
		},
	);
}
