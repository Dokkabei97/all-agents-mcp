import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectCaller, isCliAvailable } from "./detect.js";

describe("detectCaller", () => {
	const originalArgv = process.argv;
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.argv = ["node", "test"];
		for (const key of ["CLAUDECODE", "CODEX_SANDBOX_TYPE", "GEMINI_CLI", "COPILOT_CLI", "_"]) {
			delete process.env[key];
		}
	});

	afterEach(() => {
		process.argv = originalArgv;
		process.env = originalEnv;
	});

	it("returns null when no caller detected", () => {
		process.env._ = "";
		expect(detectCaller()).toBeNull();
	});

	it("detects caller from --caller= argument", () => {
		process.argv = ["node", "test", "--caller=codex"];
		expect(detectCaller()).toBe("codex");
	});

	it("ignores invalid --caller= argument", () => {
		process.argv = ["node", "test", "--caller=invalid"];
		process.env._ = "";
		expect(detectCaller()).toBeNull();
	});

	it("detects claude from CLAUDECODE env var", () => {
		process.env.CLAUDECODE = "1";
		expect(detectCaller()).toBe("claude");
	});

	it("detects codex from CODEX_SANDBOX_TYPE env var", () => {
		process.env.CODEX_SANDBOX_TYPE = "read-only";
		expect(detectCaller()).toBe("codex");
	});

	it("detects gemini from GEMINI_CLI env var", () => {
		process.env.GEMINI_CLI = "1";
		expect(detectCaller()).toBe("gemini");
	});

	it("detects copilot from COPILOT_CLI env var", () => {
		process.env.COPILOT_CLI = "1";
		expect(detectCaller()).toBe("copilot");
	});

	it("detects caller from process.env._ fallback", () => {
		process.env._ = "/usr/local/bin/claude";
		expect(detectCaller()).toBe("claude");
	});

	it("prioritizes --caller= over env vars", () => {
		process.argv = ["node", "test", "--caller=gemini"];
		process.env.CLAUDECODE = "1";
		expect(detectCaller()).toBe("gemini");
	});
});

describe("isCliAvailable", () => {
	it("returns true for existing commands", async () => {
		expect(await isCliAvailable("node")).toBe(true);
	});

	it("returns false for non-existing commands", async () => {
		expect(await isCliAvailable("nonexistent_command_xyz_123")).toBe(false);
	});
});
