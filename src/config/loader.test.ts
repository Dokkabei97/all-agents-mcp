import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildConfig, loadModelsConfig, readEnvOverrides, reloadModelsConfig } from "./loader.js";
import defaultModels from "./models.json";

describe("models.json", () => {
	const EXPECTED_AGENTS = ["claude", "codex", "gemini", "copilot"];

	it("defines all 4 agents", () => {
		expect(Object.keys(defaultModels.agents)).toEqual(EXPECTED_AGENTS);
	});

	it("each agent's default model is included in its models list", () => {
		for (const [id, agent] of Object.entries(defaultModels.agents)) {
			expect(agent.models, `${id}: default "${agent.default}" missing from models`).toContain(
				agent.default,
			);
		}
	});

	it("each agent has at least one model", () => {
		for (const [id, agent] of Object.entries(defaultModels.agents)) {
			expect(agent.models.length, `${id} should have at least 1 model`).toBeGreaterThanOrEqual(1);
		}
	});
});

describe("readEnvOverrides", () => {
	it("returns empty overrides when no env vars set", () => {
		const overrides = readEnvOverrides({});
		expect(overrides.agents).toEqual({});
	});

	it("reads DEFAULT env var for an agent", () => {
		const overrides = readEnvOverrides({ AA_MCP_CLAUDE_DEFAULT: "claude-haiku-4.5" });
		expect(overrides.agents.claude?.default).toBe("claude-haiku-4.5");
	});

	it("parses comma-separated MODELS env var", () => {
		const overrides = readEnvOverrides({ AA_MCP_GEMINI_MODELS: "gemini-2.5-pro,gemini-2.5-flash" });
		expect(overrides.agents.gemini?.models).toEqual(["gemini-2.5-pro", "gemini-2.5-flash"]);
	});

	it("trims whitespace in MODELS values", () => {
		const overrides = readEnvOverrides({
			AA_MCP_CODEX_MODELS: " gpt-5.3-codex , gpt-5.2-codex ",
		});
		expect(overrides.agents.codex?.models).toEqual(["gpt-5.3-codex", "gpt-5.2-codex"]);
	});

	it("filters empty strings from MODELS", () => {
		const overrides = readEnvOverrides({ AA_MCP_CLAUDE_MODELS: "opus,,sonnet," });
		expect(overrides.agents.claude?.models).toEqual(["opus", "sonnet"]);
	});

	it("reads ANALYSIS_LEVEL for codex", () => {
		const overrides = readEnvOverrides({ AA_MCP_CODEX_ANALYSIS_LEVEL: "medium" });
		expect(overrides.agents.codex?.defaultAnalysisLevel).toBe("medium");
	});

	it("reads multiple agents simultaneously", () => {
		const overrides = readEnvOverrides({
			AA_MCP_CLAUDE_DEFAULT: "claude-sonnet-4.5",
			AA_MCP_GEMINI_DEFAULT: "gemini-2.5-flash",
			AA_MCP_COPILOT_MODELS: "gpt-5.2-codex,gemini-2.5-pro",
		});
		expect(overrides.agents.claude?.default).toBe("claude-sonnet-4.5");
		expect(overrides.agents.gemini?.default).toBe("gemini-2.5-flash");
		expect(overrides.agents.copilot?.models).toEqual(["gpt-5.2-codex", "gemini-2.5-pro"]);
	});
});

describe("buildConfig", () => {
	it("returns default config when no env vars set", () => {
		const config = buildConfig({});
		expect(config.agents.claude.default).toBe("claude-opus-4.6");
		expect(config.agents.codex.defaultAnalysisLevel).toBe("xhigh");
		expect(config.agents.gemini.models).toHaveLength(defaultModels.agents.gemini.models.length);
	});

	it("overrides specific fields while preserving others", () => {
		const config = buildConfig({ AA_MCP_CLAUDE_DEFAULT: "claude-haiku-4.5" });
		expect(config.agents.claude.default).toBe("claude-haiku-4.5");
		// models should remain unchanged
		expect(config.agents.claude.models).toContain("claude-opus-4.6");
	});

	it("overrides models list completely", () => {
		const config = buildConfig({ AA_MCP_GEMINI_MODELS: "gemini-2.5-pro" });
		expect(config.agents.gemini.models).toEqual(["gemini-2.5-pro"]);
	});

	it("throws on invalid analysis level via Zod", () => {
		expect(() => buildConfig({ AA_MCP_CODEX_ANALYSIS_LEVEL: "ultra" })).toThrow();
	});
});

describe("loadModelsConfig / reloadModelsConfig", () => {
	const ENV_KEYS = [
		"AA_MCP_CLAUDE_DEFAULT",
		"AA_MCP_CLAUDE_MODELS",
		"AA_MCP_CODEX_DEFAULT",
		"AA_MCP_CODEX_MODELS",
		"AA_MCP_CODEX_ANALYSIS_LEVEL",
		"AA_MCP_GEMINI_DEFAULT",
		"AA_MCP_GEMINI_MODELS",
		"AA_MCP_COPILOT_DEFAULT",
		"AA_MCP_COPILOT_MODELS",
	];

	let savedEnv: Record<string, string | undefined>;

	beforeEach(() => {
		savedEnv = {};
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
		// Clear cache
		reloadModelsConfig();
	});

	afterEach(() => {
		for (const key of ENV_KEYS) {
			if (savedEnv[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = savedEnv[key];
			}
		}
	});

	it("loads default config", () => {
		const config = reloadModelsConfig();
		expect(config.agents.claude.default).toBe("claude-opus-4.6");
	});

	it("caches config on subsequent calls", () => {
		const config1 = reloadModelsConfig();
		const config2 = loadModelsConfig();
		expect(config1).toBe(config2);
	});

	it("reload clears cache and reloads", () => {
		const config1 = reloadModelsConfig();
		const config2 = reloadModelsConfig();
		expect(config1).not.toBe(config2);
		expect(config1).toEqual(config2);
	});

	it("picks up env var overrides via process.env", () => {
		process.env.AA_MCP_CLAUDE_DEFAULT = "claude-sonnet-4.5";
		const config = reloadModelsConfig();
		expect(config.agents.claude.default).toBe("claude-sonnet-4.5");
	});
});
