import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Agent to debug with"),
	error: z.string().describe("Error message or description"),
	code: z.string().optional().describe("Relevant code context"),
	context: z.string().optional().describe("Additional context (stack trace, logs, etc.)"),
	timeout: z.number().optional().describe("Timeout in ms"),
};

export function registerDebugWithTool(server: McpServer): void {
	server.tool(
		"debug_with",
		"Debug an error using a specific agent. Provide the error and optional code context.",
		SCHEMA,
		async (params) => {
			const agent = getAgent(params.agent);
			if (!agent) {
				return {
					content: [{ type: "text" as const, text: `Agent '${params.agent}' is not available.` }],
				};
			}

			let prompt = `Debug this error:\n\nError: ${params.error}\n`;
			if (params.code) prompt += `\nRelevant code:\n\`\`\`\n${params.code}\n\`\`\`\n`;
			if (params.context) prompt += `\nAdditional context:\n${params.context}\n`;
			prompt +=
				"\nProvide:\n1. Root cause analysis\n2. Step-by-step fix\n3. Prevention recommendations";

			const response = await agent.execute({
				prompt,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "debug_with",
				agent: response.agent,
				model: response.model,
				prompt,
				response: response.content,
				durationMs: response.durationMs,
				exitCode: response.exitCode,
				error: response.error,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `## Debug Analysis by ${agent.displayName}\n\n${response.content}`,
					},
				],
			};
		},
	);
}
