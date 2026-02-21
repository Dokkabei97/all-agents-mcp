import defaultModels from "./models.json";
import { MODELS_CONFIG_SCHEMA, type ModelsConfig } from "./schema.js";

/**
 * Default model configuration loaded from models.json.
 * Override at runtime via AA_MCP_{AGENT}_{FIELD} environment variables.
 */
const DEFAULT_CONFIG: ModelsConfig = MODELS_CONFIG_SCHEMA.parse(defaultModels);

const AGENT_IDS = ["claude", "codex", "gemini", "copilot"] as const;

type AgentId = (typeof AGENT_IDS)[number];

interface EnvOverrides {
	agents: Partial<
		Record<
			AgentId,
			{
				default?: string;
				models?: string[];
				defaultAnalysisLevel?: string;
			}
		>
	>;
}

function parseModelsList(value: string): string[] {
	return value
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

export function readEnvOverrides(
	env: Record<string, string | undefined> = process.env,
): EnvOverrides {
	const overrides: EnvOverrides = { agents: {} };

	for (const agentId of AGENT_IDS) {
		const upper = agentId.toUpperCase();
		const prefix = `AA_MCP_${upper}`;

		const defaultModel = env[`${prefix}_DEFAULT`];
		const modelsRaw = env[`${prefix}_MODELS`];
		const analysisLevel = env[`${prefix}_ANALYSIS_LEVEL`];

		const agentOverride: Record<string, unknown> = {};
		let hasOverride = false;

		if (defaultModel !== undefined) {
			agentOverride.default = defaultModel;
			hasOverride = true;
		}
		if (modelsRaw !== undefined) {
			agentOverride.models = parseModelsList(modelsRaw);
			hasOverride = true;
		}
		if (analysisLevel !== undefined) {
			agentOverride.defaultAnalysisLevel = analysisLevel;
			hasOverride = true;
		}

		if (hasOverride) {
			overrides.agents[agentId] = agentOverride as EnvOverrides["agents"][AgentId];
		}
	}

	return overrides;
}

export function buildConfig(env: Record<string, string | undefined> = process.env): ModelsConfig {
	const overrides = readEnvOverrides(env);

	const merged = structuredClone(DEFAULT_CONFIG) as Record<string, unknown>;
	const agents = merged.agents as Record<string, Record<string, unknown>>;
	for (const agentId of AGENT_IDS) {
		const agentOverride = overrides.agents[agentId];
		if (agentOverride) {
			agents[agentId] = { ...agents[agentId], ...agentOverride };
		}
	}

	return MODELS_CONFIG_SCHEMA.parse(merged);
}

let cachedConfig: ModelsConfig | null = null;

export function loadModelsConfig(): ModelsConfig {
	if (cachedConfig) return cachedConfig;
	cachedConfig = buildConfig();
	return cachedConfig;
}

export function reloadModelsConfig(): ModelsConfig {
	cachedConfig = null;
	return loadModelsConfig();
}
