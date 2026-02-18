import type { AgentResponse, ExecutionOptions, IAgent } from "../agents/types.js";
import { logger } from "../utils/logger.js";

export interface ParallelResult {
	responses: AgentResponse[];
	errors: Array<{ agent: string; error: string }>;
	totalDurationMs: number;
}

export async function executeParallel(
	agents: IAgent[],
	options: ExecutionOptions,
): Promise<ParallelResult> {
	const startTime = Date.now();

	logger.info(`Executing ${agents.length} agents in parallel`);

	const results = await Promise.allSettled(agents.map((agent) => agent.execute(options)));

	const responses: AgentResponse[] = [];
	const errors: Array<{ agent: string; error: string }> = [];

	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		const agent = agents[i];

		if (result.status === "fulfilled") {
			responses.push(result.value);
			if (result.value.error) {
				errors.push({ agent: agent.id, error: result.value.error });
			}
		} else {
			errors.push({
				agent: agent.id,
				error: result.reason instanceof Error ? result.reason.message : String(result.reason),
			});
		}
	}

	return {
		responses,
		errors,
		totalDurationMs: Date.now() - startTime,
	};
}
