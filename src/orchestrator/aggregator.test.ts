import { describe, expect, it } from "vitest";
import type { AgentResponse } from "../agents/types.js";
import {
	formatComparisonResult,
	formatParallelResult,
	formatSingleResponse,
	formatVerificationResult,
} from "./aggregator.js";
import type { ParallelResult } from "./parallel.js";

const makeResponse = (overrides: Partial<AgentResponse> = {}): AgentResponse => ({
	agent: "claude",
	model: "opus-4",
	content: "Test response",
	durationMs: 1000,
	exitCode: 0,
	...overrides,
});

describe("formatSingleResponse", () => {
	it("formats a successful response", () => {
		const result = formatSingleResponse(makeResponse());
		expect(result).toContain("claude");
		expect(result).toContain("opus-4");
		expect(result).toContain("1000ms");
		expect(result).toContain("Test response");
	});

	it("formats an error response", () => {
		const result = formatSingleResponse(makeResponse({ error: "Something failed" }));
		expect(result).toContain("Error: Something failed");
	});
});

describe("formatParallelResult", () => {
	it("formats multiple agent responses", () => {
		const parallelResult: ParallelResult = {
			responses: [
				makeResponse({ agent: "claude" }),
				makeResponse({ agent: "codex", model: "gpt-4" }),
			],
			errors: [],
			totalDurationMs: 2000,
		};

		const result = formatParallelResult(parallelResult);
		expect(result).toContain("Multi-Agent Results");
		expect(result).toContain("claude");
		expect(result).toContain("codex");
		expect(result).toContain("2000ms");
	});

	it("includes errors section when errors exist", () => {
		const parallelResult: ParallelResult = {
			responses: [],
			errors: [{ agent: "codex", error: "timeout" }],
			totalDurationMs: 5000,
		};

		const result = formatParallelResult(parallelResult);
		expect(result).toContain("Errors");
		expect(result).toContain("codex");
		expect(result).toContain("timeout");
	});
});

describe("formatComparisonResult", () => {
	it("returns message for no responses", () => {
		expect(formatComparisonResult([])).toBe("No responses received.");
	});

	it("delegates to formatSingleResponse for one response", () => {
		const result = formatComparisonResult([makeResponse()]);
		expect(result).toContain("claude");
		expect(result).not.toContain("Cross-Agent Comparison");
	});

	it("formats comparison for multiple responses", () => {
		const responses = [
			makeResponse({ agent: "claude", durationMs: 500 }),
			makeResponse({ agent: "codex", durationMs: 1500 }),
		];

		const result = formatComparisonResult(responses);
		expect(result).toContain("Cross-Agent Comparison");
		expect(result).toContain("Fastest");
		expect(result).toContain("Slowest");
		expect(result).toContain("Total agents");
	});
});

describe("formatVerificationResult", () => {
	it("formats cross-model verification", () => {
		const responses = [
			makeResponse({ model: "opus-4" }),
			makeResponse({ model: "sonnet-4", error: "failed" }),
		];

		const result = formatVerificationResult("claude", responses);
		expect(result).toContain("Cross-Model Verification (claude)");
		expect(result).toContain("opus-4");
		expect(result).toContain("sonnet-4");
		expect(result).toContain("Successful**: 1");
		expect(result).toContain("Failed**: 1");
	});
});
