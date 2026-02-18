import type { AgentResponse } from "../agents/types.js";
import type { ParallelResult } from "./parallel.js";

export function formatParallelResult(result: ParallelResult): string {
	const sections: string[] = [];

	sections.push(`## Multi-Agent Results (${result.totalDurationMs}ms total)\n`);

	for (const response of result.responses) {
		const status = response.error ? "ERROR" : "OK";
		sections.push(
			`### ${response.agent} (${response.model}) [${status}] — ${response.durationMs}ms`,
		);
		sections.push(response.error ? `Error: ${response.error}` : response.content);
		sections.push("");
	}

	if (result.errors.length > 0) {
		sections.push("### Errors");
		for (const err of result.errors) {
			sections.push(`- **${err.agent}**: ${err.error}`);
		}
		sections.push("");
	}

	return sections.join("\n");
}

export function formatComparisonResult(responses: AgentResponse[]): string {
	if (responses.length === 0) return "No responses received.";
	if (responses.length === 1) return formatSingleResponse(responses[0]);

	const sections: string[] = [];
	sections.push("## Cross-Agent Comparison\n");

	for (const response of responses) {
		sections.push(`### ${response.agent} (${response.model}) — ${response.durationMs}ms`);
		sections.push(response.content);
		sections.push("");
	}

	sections.push("### Summary");
	sections.push(`- **Total agents**: ${responses.length}`);
	sections.push(
		`- **Fastest**: ${responses.reduce((a, b) => (a.durationMs < b.durationMs ? a : b)).agent}`,
	);
	sections.push(
		`- **Slowest**: ${responses.reduce((a, b) => (a.durationMs > b.durationMs ? a : b)).agent}`,
	);

	return sections.join("\n");
}

export function formatSingleResponse(response: AgentResponse): string {
	const header = `**${response.agent}** (${response.model}) — ${response.durationMs}ms`;

	if (response.error) {
		return `${header}\n\nError: ${response.error}`;
	}

	return `${header}\n\n${response.content}`;
}

export function formatVerificationResult(agent: string, responses: AgentResponse[]): string {
	const sections: string[] = [];
	sections.push(`## Cross-Model Verification (${agent})\n`);

	for (const response of responses) {
		sections.push(`### Model: ${response.model} — ${response.durationMs}ms`);
		sections.push(response.content);
		sections.push("");
	}

	const successCount = responses.filter((r) => !r.error).length;
	sections.push("### Verification Summary");
	sections.push(`- **Models tested**: ${responses.length}`);
	sections.push(`- **Successful**: ${successCount}`);
	sections.push(`- **Failed**: ${responses.length - successCount}`);

	return sections.join("\n");
}
