import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Agent to explain with"),
	code: z.string().describe("Code to explain"),
	detail: z.enum(["brief", "detailed"]).optional().default("detailed").describe("Level of detail"),
	timeout: z.number().optional().describe("Timeout in ms"),
};

export function registerExplainWithTool(server: McpServer): void {
	server.tool(
		"explain_with",
		"Get code explanation from a specific agent. Choose brief or detailed level.",
		SCHEMA,
		async (params) => {
			const agent = getAgent(params.agent);
			if (!agent) {
				return {
					content: [{ type: "text" as const, text: `Agent '${params.agent}' is not available.` }],
				};
			}

			const detailInstruction =
				params.detail === "brief"
					? "Provide a concise summary (2-3 sentences) of what this code does."
					: [
							"Provide a detailed explanation including:",
							"1. Overall purpose",
							"2. Key logic flow",
							"3. Important patterns or techniques used",
							"4. Dependencies and side effects",
						].join("\n");

			const prompt = `Explain this code:\n\n\`\`\`\n${params.code}\n\`\`\`\n\n${detailInstruction}`;

			const response = await agent.execute({
				prompt,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "explain_with",
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
						text: `## Explanation by ${agent.displayName}\n\n${response.content}`,
					},
				],
			};
		},
	);
}
