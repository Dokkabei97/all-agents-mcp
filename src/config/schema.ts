import { z } from "zod";

const AGENT_ID_SCHEMA = z.enum(["claude", "codex", "gemini", "copilot"]);

const ANALYSIS_LEVEL_SCHEMA = z.enum(["low", "medium", "high", "xhigh"]);

const MODEL_CONFIG_SCHEMA = z.object({
	name: z.string(),
	timeoutSeconds: z.number().positive().optional(),
});

const AGENT_CONFIG_SCHEMA = z.object({
	default: z.string(),
	models: z.array(MODEL_CONFIG_SCHEMA).min(1),
	defaultAnalysisLevel: ANALYSIS_LEVEL_SCHEMA.optional(),
	defaultTimeoutSeconds: z.number().positive().optional(),
});

export const MODELS_CONFIG_SCHEMA = z.object({
	agents: z.record(AGENT_ID_SCHEMA, AGENT_CONFIG_SCHEMA),
});

export type ModelConfig = z.infer<typeof MODEL_CONFIG_SCHEMA>;
export type ModelsConfig = z.infer<typeof MODELS_CONFIG_SCHEMA>;
export type AnalysisLevel = z.infer<typeof ANALYSIS_LEVEL_SCHEMA>;
