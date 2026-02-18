import { describe, expect, it } from "vitest";
import { analyzeComplexity } from "./complexity.js";

describe("analyzeComplexity", () => {
	it("returns simple for short prompts without keywords", () => {
		const result = analyzeComplexity("Fix the button color");
		expect(result.level).toBe("simple");
		expect(result.score).toBe(0);
		expect(result.reasons).toHaveLength(0);
	});

	it("scores medium prompt length (>500 chars)", () => {
		const task = "a".repeat(501);
		const result = analyzeComplexity(task);
		expect(result.score).toBeGreaterThanOrEqual(1);
		expect(result.reasons).toContain("Medium prompt (>500 chars)");
	});

	it("scores long prompt length (>1000 chars)", () => {
		const task = "a".repeat(1001);
		const result = analyzeComplexity(task);
		expect(result.score).toBeGreaterThanOrEqual(3);
		expect(result.reasons).toContain("Long prompt (>1000 chars)");
	});

	it("detects large task keywords (Korean)", () => {
		const result = analyzeComplexity("프로젝트 전체 리팩터링 해주세요");
		expect(result.level).toBe("large");
		expect(result.reasons.some((r) => r.includes("Large task keyword"))).toBe(true);
	});

	it("detects large task keywords (English)", () => {
		const result = analyzeComplexity("Refactor the entire codebase");
		expect(result.level).toBe("large");
	});

	it("detects complex keywords", () => {
		const result = analyzeComplexity("analyze the architecture");
		expect(result.reasons.some((r) => r.includes("Complex keyword"))).toBe(true);
	});

	it("detects multi-task markers (numbered lists)", () => {
		const result = analyzeComplexity("1. Fix bug\n2. Add tests\n3. Update docs");
		expect(result.reasons.some((r) => r.includes("Multiple sub-tasks"))).toBe(true);
	});

	it("detects multi-task markers (Korean conjunctions)", () => {
		const result = analyzeComplexity("버그 수정하고 또한 테스트 추가하고 추가로 문서 업데이트");
		expect(result.reasons.some((r) => r.includes("Multiple sub-tasks"))).toBe(true);
	});

	it("detects multiple file references", () => {
		const result = analyzeComplexity("Update main.ts, utils.ts, helper.ts, config.yaml");
		expect(result.reasons.some((r) => r.includes("Multiple file references"))).toBe(true);
	});

	it("returns complex level for score 3-5", () => {
		const result = analyzeComplexity("코드를 분석하고 비교해서 최적화 해주세요");
		expect(result.level).toBe("complex");
		expect(result.score).toBeGreaterThanOrEqual(3);
		expect(result.score).toBeLessThan(6);
	});

	it("returns large level for score >= 6", () => {
		const result = analyzeComplexity("전체 프로젝트를 리팩터링하고 마이그레이션 해주세요");
		expect(result.level).toBe("large");
		expect(result.score).toBeGreaterThanOrEqual(6);
	});
});
