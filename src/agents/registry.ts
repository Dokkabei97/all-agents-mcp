import { loadModelsConfig } from "../config/loader.js";
import { detectCaller } from "../utils/detect.js";
import { logger } from "../utils/logger.js";
import { ClaudeAgent } from "./claude-agent.js";
import { CodexAgent } from "./codex-agent.js";
import { CopilotAgent } from "./copilot-agent.js";
import { GeminiAgent } from "./gemini-agent.js";
import type { AgentId, IAgent } from "./types.js";

let registry: Map<AgentId, IAgent> | null = null;

export function getAgentRegistry(): Map<AgentId, IAgent> {
	if (registry) return registry;

	const config = loadModelsConfig();
	const caller = detectCaller();

	if (caller) {
		logger.info(`Detected caller: ${caller} — excluding from available agents`);
	}

	registry = new Map<AgentId, IAgent>();

	const agents = config.agents;
	const agentFactories: Record<AgentId, () => IAgent> = {
		// biome-ignore lint/style/noNonNullAssertion: config is validated by Zod
		claude: () => new ClaudeAgent(agents.claude!),
		// biome-ignore lint/style/noNonNullAssertion: config is validated by Zod
		codex: () => new CodexAgent(agents.codex!),
		// biome-ignore lint/style/noNonNullAssertion: config is validated by Zod
		gemini: () => new GeminiAgent(agents.gemini!),
		// biome-ignore lint/style/noNonNullAssertion: config is validated by Zod
		copilot: () => new CopilotAgent(agents.copilot!),
	};

	for (const [id, factory] of Object.entries(agentFactories)) {
		if (id === caller) {
			logger.info(`Skipping ${id} (caller) to prevent recursive invocation`);
			continue;
		}
		registry.set(id as AgentId, factory());
	}

	return registry;
}

export function getAgent(id: AgentId): IAgent | undefined {
	return getAgentRegistry().get(id);
}

export async function getAvailableAgents(): Promise<IAgent[]> {
	const agents = Array.from(getAgentRegistry().values());
	const checks = await Promise.all(
		agents.map(async (agent) => ({
			agent,
			available: await agent.isAvailable(),
		})),
	);
	return checks.filter((c) => c.available).map((c) => c.agent);
}

export function getAllRegisteredAgents(): IAgent[] {
	return Array.from(getAgentRegistry().values());
}

export function resetRegistry(): void {
	registry = null;
}
