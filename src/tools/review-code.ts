import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const SCHEMA = {
	agent: z.enum(["claude", "codex", "gemini", "copilot"]).describe("Agent to review with"),
	code: z.string().describe("Code to review (inline code or file content)"),
	filePath: z.string().optional().describe("File path for context"),
	focus: z
		.enum(["bugs", "security", "performance", "clarity"])
		.optional()
		.describe("Specific review focus area"),
	timeout: z.number().optional().describe("Timeout in ms"),
};

export function registerReviewCodeTool(server: McpServer): void {
	server.tool(
		"review_code",
		"Review code using a specific agent. Analyzes for bugs, security, performance, and clarity.",
		SCHEMA,
		async (params) => {
			const agent = getAgent(params.agent);
			if (!agent) {
				return {
					content: [{ type: "text" as const, text: `Agent '${params.agent}' is not available.` }],
				};
			}

			const focusInstructions = params.focus
				? `Focus specifically on: ${params.focus}\n\n`
				: `${[
						"Analyze the following aspects:",
						"1. Bugs and logic errors",
						"2. Security vulnerabilities",
						"3. Performance issues",
						"4. Code clarity and maintainability\n",
					].join("\n")}\n`;

			const fileContext = params.filePath ? `File: ${params.filePath}\n\n` : "";

			const prompt = [
				"Code Review Request:",
				`${focusInstructions}${fileContext}Code:`,
				"```",
				params.code,
				"```",
				"",
				"Provide a structured review with severity levels",
				"(Critical/Warning/Info) for each finding.",
			].join("\n");

			const response = await agent.execute({
				prompt,
				timeout: params.timeout,
			});

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "review_code",
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
						text: `## Code Review by ${agent.displayName} (${response.model})\n\n${response.content}`,
					},
				],
			};
		},
	);
}
