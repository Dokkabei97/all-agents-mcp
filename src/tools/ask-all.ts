import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent, getAvailableAgents } from "../agents/registry.js";
import { formatParallelResult } from "../orchestrator/aggregator.js";
import { executeParallel } from "../orchestrator/parallel.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	prompt: z.string().describe("The question or prompt to send to all agents"),
	agents: z
		.array(z.enum(["claude", "codex", "gemini", "copilot"]))
		.optional()
		.describe("Specific agents to query (defaults to all available)"),
	context: z.string().optional().describe("Additional context to pipe via stdin"),
	timeout: z.number().optional().describe("Timeout in milliseconds (default: 120000)"),
};

export function registerAskAllTool(server: McpServer): void {
	server.tool(
		"ask_all",
		"Ask multiple agents the same question in parallel. Use for explicit multi-agent comparison.",
		SCHEMA,
		async (params) => {
			let agents: import("../agents/types.js").IAgent[];
			if (params.agents && params.agents.length > 0) {
				agents = params.agents
					.map((id) => getAgent(id))
					.filter((a): a is NonNullable<typeof a> => a != null);
			} else {
				agents = await getAvailableAgents();
			}

			if (agents.length === 0) {
				return {
					content: [{ type: "text" as const, text: "No agents available." }],
				};
			}

			const result = await executeParallel(agents, {
				prompt: params.prompt,
				context: params.context,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			for (const response of result.responses) {
				addEntry(sessionId, {
					tool: "ask_all",
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
				content: [{ type: "text" as const, text: formatParallelResult(result) }],
			};
		},
	);
}
