import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { crossVerify } from "../orchestrator/verifier.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Agent to verify with"),
	prompt: z.string().describe("The prompt to verify across models"),
	models: z
		.array(z.string())
		.optional()
		.describe("Specific models to use (defaults to all agent models)"),
	context: z.string().optional().describe("Additional context"),
	timeout: z.number().optional().describe("Timeout per model in ms"),
};

export function registerVerifyTool(server: McpServer): void {
	server.tool(
		"verify",
		"Cross-verify by running the same prompt across multiple models of one agent. Compares results for consistency.",
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

			const models = params.models ?? agent.getModels();
			if (models.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No models available for agent '${params.agent}'.`,
						},
					],
				};
			}

			const result = await crossVerify(agent, {
				prompt: params.prompt,
				models,
				context: params.context,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			for (const response of result.responses) {
				addEntry(sessionId, {
					tool: "verify",
					agent: response.agent,
					model: response.model,
					prompt: params.prompt,
					response: response.content,
					durationMs: response.durationMs,
					exitCode: response.exitCode,
					error: response.error,
				});
			}

			return {
				content: [{ type: "text" as const, text: result.formatted }],
			};
		},
	);
}
