import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent, getAvailableAgents } from "../agents/registry.js";
import type { AgentResponse, IAgent } from "../agents/types.js";
import { formatParallelResult, formatSingleResponse } from "../orchestrator/aggregator.js";
import type { ComplexityResult } from "../orchestrator/complexity.js";
import { analyzeComplexity } from "../orchestrator/complexity.js";
import { executeParallel } from "../orchestrator/parallel.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	task: z.string().describe("The task to delegate"),
	agent: z
		.enum(["claude", "codex", "gemini", "copilot"])
		.optional()
		.describe("Preferred agent (auto-selected if omitted)"),
	allowParallel: z
		.boolean()
		.default(true)
		.describe("Allow splitting large tasks across multiple agents"),
	context: z.string().optional().describe("Additional context"),
	timeout: z.number().optional().describe("Timeout in ms"),
};

function recordEntry(sessionId: string, task: string, response: AgentResponse): void {
	addEntry(sessionId, {
		tool: "delegate_task",
		agent: response.agent,
		model: response.model,
		prompt: task,
		response: response.content,
		durationMs: response.durationMs,
		exitCode: response.exitCode,
		error: response.error,
	});
}

function formatHeader(complexity: ComplexityResult, suffix?: string): string {
	let header = `**Complexity**: ${complexity.level} (score: ${complexity.score})\n`;
	header += `**Reasons**: ${complexity.reasons.join(", ")}\n`;
	if (suffix) header += suffix;
	return `${header}\n`;
}

export function registerDelegateTaskTool(server: McpServer): void {
	server.tool(
		"delegate_task",
		"Delegate a task to agent(s). Automatically analyzes complexity and routes to single or parallel execution.",
		SCHEMA,
		async (params) => {
			const complexity = analyzeComplexity(params.task);
			const sessionId = getOrCreateActiveSession();

			if (complexity.level !== "large" || !params.allowParallel) {
				return handleSingle(params, complexity, sessionId);
			}
			return handleParallel(params, complexity, sessionId);
		},
	);
}

async function handleSingle(
	params: {
		task: string;
		agent?: "claude" | "codex" | "gemini" | "copilot";
		context?: string;
		timeout?: number;
	},
	complexity: ComplexityResult,
	sessionId: string,
) {
	let agent: IAgent | undefined;
	if (params.agent) {
		agent = getAgent(params.agent);
	} else {
		const available = await getAvailableAgents();
		agent = available[0];
	}

	if (!agent) {
		return { content: [{ type: "text" as const, text: "No agents available for delegation." }] };
	}

	const extendedTimeout =
		complexity.level === "complex" ? (params.timeout ?? 120_000) * 2 : params.timeout;

	const response = await agent.execute({
		prompt: params.task,
		context: params.context,
		timeout: extendedTimeout,
	});

	recordEntry(sessionId, params.task, response);
	const header = formatHeader(complexity);
	return { content: [{ type: "text" as const, text: header + formatSingleResponse(response) }] };
}

async function handleParallel(
	params: { task: string; context?: string; timeout?: number },
	complexity: ComplexityResult,
	sessionId: string,
) {
	const agents = await getAvailableAgents();
	if (agents.length === 0) {
		return { content: [{ type: "text" as const, text: "No agents available for delegation." }] };
	}

	const result = await executeParallel(agents, {
		prompt: params.task,
		context: params.context,
		timeout: params.timeout ? params.timeout * 2 : 240_000,
	});

	for (const response of result.responses) {
		recordEntry(sessionId, params.task, response);
	}

	const header = formatHeader(
		complexity,
		`**Mode**: Parallel delegation to ${agents.length} agents\n`,
	);
	return { content: [{ type: "text" as const, text: header + formatParallelResult(result) }] };
}
