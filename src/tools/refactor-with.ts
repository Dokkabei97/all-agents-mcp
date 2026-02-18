import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Agent to refactor with"),
	code: z.string().describe("Code to refactor"),
	goal: z
		.enum(["performance", "readability", "modularity"])
		.optional()
		.describe("Refactoring goal"),
	timeout: z.number().optional().describe("Timeout in ms"),
};

export function registerRefactorWithTool(server: McpServer): void {
	server.tool(
		"refactor_with",
		"Refactor code using a specific agent. Optionally specify a goal: performance, readability, or modularity.",
		SCHEMA,
		async (params) => {
			const agent = getAgent(params.agent);
			if (!agent) {
				return {
					content: [{ type: "text" as const, text: `Agent '${params.agent}' is not available.` }],
				};
			}

			const goalInstruction = params.goal
				? `Refactor with a focus on: ${params.goal}`
				: "Refactor for overall code quality improvement";

			const prompt = [
				goalInstruction,
				"",
				"Original code:",
				"```",
				params.code,
				"```",
				"",
				"Provide:",
				"1. Refactored code",
				"2. List of changes made",
				"3. Explanation of improvements",
			].join("\n");

			const response = await agent.execute({
				prompt,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "refactor_with",
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
						text: `## Refactoring by ${agent.displayName}\n\n${response.content}`,
					},
				],
			};
		},
	);
}
