import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAgent } from "../agents/registry.js";
import { addEntry, getOrCreateActiveSession } from "../session/store.js";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const DEFAULT_TIMEOUT = 120000;

const SCHEMA = {
	url: z.string().url().describe("Target URL to fetch content from"),
	instruction: z
		.string()
		.optional()
		.describe("Optional extraction/focus instruction (e.g. 'extract only the API table')"),
	model: z.string().optional().describe(`Gemini model to use (default: ${DEFAULT_MODEL})`),
	timeout: z.number().optional().describe(`Timeout in milliseconds (default: ${DEFAULT_TIMEOUT})`),
};

export function buildFetchPrompt(url: string, instruction?: string): string {
	const lines = [
		"Fetch the content from the following URL and return it:",
		"",
		`URL: ${url}`,
		"",
		"Instructions:",
		"- Access the URL and retrieve the full page content",
		"- Convert the content to well-formatted Markdown",
		"- Preserve code blocks, tables, lists, and headings",
		"- Remove navigation, ads, footers, and other non-content elements",
		"- If the page cannot be accessed, explain the error clearly",
	];

	if (instruction) {
		lines.push("", `Additional focus: ${instruction}`);
	}

	lines.push("", "Return ONLY the extracted content, no preamble or commentary.");

	return lines.join("\n");
}

export function registerFetchPageTool(server: McpServer): void {
	server.tool(
		"fetch_page",
		"Fetch web page content via Gemini CLI. Gemini has native web browsing — use this to retrieve and extract content from URLs.",
		SCHEMA,
		async (params) => {
			const agent = getAgent("gemini");
			if (!agent) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Gemini agent is not available. It may not be installed or is the current caller.",
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
							text: "Gemini CLI is not installed or not in PATH. Install it with: npm i -g @google/gemini-cli",
						},
					],
				};
			}

			const model = params.model ?? DEFAULT_MODEL;
			const timeout = params.timeout ?? DEFAULT_TIMEOUT;
			const prompt = buildFetchPrompt(params.url, params.instruction);

			const response = await agent.execute({ prompt, model, timeout });

			const sessionId = getOrCreateActiveSession();
			addEntry(sessionId, {
				tool: "fetch_page",
				agent: response.agent,
				model: response.model,
				prompt: `[fetch] ${params.url}`,
				response: response.content,
				durationMs: response.durationMs,
				exitCode: response.exitCode,
				error: response.error,
			});

			const header = `**Fetched**: ${params.url}\n**Model**: ${response.model} — ${response.durationMs}ms`;

			if (response.error) {
				return {
					content: [{ type: "text" as const, text: `${header}\n\nError: ${response.error}` }],
				};
			}

			return {
				content: [{ type: "text" as const, text: `${header}\n\n${response.content}` }],
			};
		},
	);
}
