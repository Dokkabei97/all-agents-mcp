import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Agent to collaborate with"),
	prompt: z.string().describe("The question or analysis request"),
	context: z.string().optional().describe("Additional context (code, docs, etc.)"),
	timeout: z.number().optional().describe("Timeout in ms"),
};

export function registerCollaborateTool(server: McpServer): void {
	server.tool(
		"collaborate",
		"Collaborate with an agent for analysis. Sends prompt, gets response, and provides guidance for comparison.",
		SCHEMA,
		async (params) => {
			const agent = getAgent(params.agent);
			if (!agent) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Agent '${params.agent}' is not available.`,
						},
					],
				};
			}

			const response = await agent.execute({
				prompt: params.prompt,
				context: params.context,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "collaborate",
				agent: response.agent,
				model: response.model,
				prompt: params.prompt,
				response: response.content,
				durationMs: response.durationMs,
				exitCode: response.exitCode,
				error: response.error,
			});

			const sections = [
				`## Collaboration with ${agent.displayName}\n`,
				`### ${agent.displayName}'s Response (${response.model}, ${response.durationMs}ms)`,
				response.error ? `Error: ${response.error}` : response.content,
				"",
				"### Analysis Guide",
				"Compare the above response with your own analysis:",
				"1. **Agreements**: Points where both analyses align",
				"2. **Differences**: Areas of divergent opinion",
				"3. **Synthesis**: Combine the best insights from both perspectives",
				"4. **Recommendation**: Select the optimal approach based on the comparison",
			];

			return {
				content: [{ type: "text" as const, text: sections.join("\n") }],
			};
		},
	);
}
