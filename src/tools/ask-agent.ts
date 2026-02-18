import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { formatSingleResponse } from "../orchestrator/aggregator.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Target agent to query"),
	prompt: z.string().describe("The question or prompt to send"),
	model: z.string().optional().describe("Specific model to use (defaults to agent default)"),
	context: z.string().optional().describe("Additional context to pipe via stdin"),
	timeout: z.number().optional().describe("Timeout in milliseconds (default: 120000)"),
	analysisLevel: z
		.enum(["low", "medium", "high", "xhigh"])
		.optional()
		.describe("Analysis depth level (codex only)"),
};

export function registerAskAgentTool(server: McpServer): void {
	server.tool(
		"ask_agent",
		"Ask a specific AI agent a question. Use when targeting a single agent like 'ask codex' or 'ask gemini'.",
		SCHEMA,
		async (params) => {
			const agent = getAgent(params.agent);
			if (!agent) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Agent '${params.agent}' is not available. It may not be installed or is the current caller.`,
						},
					],
				};
			}

			const available = await agent.isAvailable();
			if (!available) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Agent '${params.agent}' CLI is not installed or not in PATH.`,
						},
					],
				};
			}

			const response = await agent.execute({
				prompt: params.prompt,
				model: params.model,
				context: params.context,
				timeout: params.timeout,
				analysisLevel: params.analysisLevel,
			});

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "ask_agent",
				agent: response.agent,
				model: response.model,
				prompt: params.prompt,
				response: response.content,
				durationMs: response.durationMs,
				exitCode: response.exitCode,
				error: response.error,
			});

			return {
				content: [{ type: "text" as const, text: formatSingleResponse(response) }],
			};
		},
	);
}
