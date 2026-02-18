import type { AgentResponse, IAgent } from "../agents/types.js";
import { logger } from "../utils/logger.js";
import { formatVerificationResult } from "./aggregator.js";

export interface VerificationOptions {
	prompt: string;
	models: string[];
	timeout?: number;
	cwd?: string;
	context?: string;
}

export interface VerificationResult {
	agent: string;
	responses: AgentResponse[];
	formatted: string;
	totalDurationMs: number;
}

interface ExecutionParams {
	prompt: string;
	timeout?: number;
	cwd?: string;
	context?: string;
}

async function executeModelsParallel(
	agent: IAgent,
	models: string[],
	params: ExecutionParams,
): Promise<AgentResponse[]> {
	const results = await Promise.allSettled(
		models.map((model) => agent.execute({ ...params, model })),
	);

	const responses: AgentResponse[] = [];
	for (const result of results) {
		if (result.status === "fulfilled") {
			responses.push(result.value);
		}
	}
	return responses;
}

async function executeModelsSequential(
	agent: IAgent,
	models: string[],
	params: ExecutionParams,
): Promise<AgentResponse[]> {
	const responses: AgentResponse[] = [];
	for (const model of models) {
		try {
			const response = await agent.execute({ ...params, model });
			responses.push(response);
		} catch (err) {
			logger.warn(`Sequential execution failed for ${agent.id}/${model}: ${err}`);
		}
	}
	return responses;
}

export async function crossVerify(
	agent: IAgent,
	options: VerificationOptions,
): Promise<VerificationResult> {
	const startTime = Date.now();
	const { prompt, models, timeout, cwd, context } = options;

	logger.info(`Cross-verifying ${agent.id} with ${models.length} models: ${models.join(", ")}`);

	const params: ExecutionParams = { prompt, timeout, cwd, context };
	const responses = agent.supportsParallelExecution
		? await executeModelsParallel(agent, models, params)
		: await executeModelsSequential(agent, models, params);

	const formatted = formatVerificationResult(agent.id, responses);

	return {
		agent: agent.id,
		responses,
		formatted,
		totalDurationMs: Date.now() - startTime,
	};
}
