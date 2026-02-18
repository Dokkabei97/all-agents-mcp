import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listSessions } from "../session/store.js";

export function registerSessionsListResource(server: McpServer): void {
	server.resource("sessions-list", "aa://sessions", async (uri) => ({
		contents: [
			{
				uri: uri.href,
				mimeType: "application/json",
				text: JSON.stringify(listSessions(), null, 2),
			},
		],
	}));
}
