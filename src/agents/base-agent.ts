import { type SpawnOptions, spawnAgent } from "../orchestrator/executor.js";
import { isCliAvailable } from "../utils/detect.js";
import { logger } from "../utils/logger.js";
import type {
	AgentConfig,
	AgentId,
	AgentResponse,
	ExecutionOptions,
	HealthStatus,
	IAgent,
} from "./types.js";

export abstract class BaseAgent implements IAgent {
	abstract readonly id: AgentId;
	abstract readonly displayName: string;
	abstract readonly cliCommand: string;
	readonly supportsParallelExecution: boolean = true;

	protected config: AgentConfig;

	constructor(config: AgentConfig) {
		this.config = config;
	}

	async isAvailable(): Promise<boolean> {
		return isCliAvailable(this.cliCommand);
	}

	getModels(): string[] {
		return this.config.models;
	}

	getDefaultModel(): string {
		return this.config.default;
	}

	async execute(options: ExecutionOptions): Promise<AgentResponse> {
		const model = options.model ?? this.getDefaultModel();
		const spawnOptions = this.buildSpawnOptions(options, model);

		logger.info(`Executing ${this.displayName} with model ${model}`);

		const result = await spawnAgent(spawnOptions);

		if (result.timedOut) {
			return {
				agent: this.id,
				model,
				content: "",
				durationMs: result.durationMs,
				exitCode: 124,
				error: `Timed out after ${options.timeout ?? 120000}ms`,
			};
		}

		const content = this.parseOutput(result.stdout, result.stderr);

		return {
			agent: this.id,
			model,
			content,
			durationMs: result.durationMs,
			exitCode: result.exitCode,
			error: result.exitCode !== 0 ? result.stderr || `Exit code: ${result.exitCode}` : undefined,
		};
	}

	async healthCheck(): Promise<HealthStatus> {
		const startTime = Date.now();

		const available = await this.isAvailable();
		if (!available) {
			return {
				agent: this.id,
				available: false,
				authenticated: false,
				error: `CLI '${this.cliCommand}' not found`,
			};
		}

		try {
			const response = await this.execute({
				prompt: "Reply with exactly: OK",
				timeout: 30_000,
			});

			return {
				agent: this.id,
				available: true,
				authenticated: response.exitCode === 0,
				latencyMs: Date.now() - startTime,
				error: response.error,
			};
		} catch (err) {
			return {
				agent: this.id,
				available: true,
				authenticated: false,
				latencyMs: Date.now() - startTime,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}

	protected abstract buildSpawnOptions(options: ExecutionOptions, model: string): SpawnOptions;

	protected parseOutput(stdout: string, _stderr: string): string {
		return stdout.trim();
	}
}
