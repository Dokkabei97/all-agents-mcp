import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type SpawnOptions, spawnAgent } from "../orchestrator/executor.js";
import { logger } from "../utils/logger.js";
import { BaseAgent } from "./base-agent.js";
import type { AgentConfig, AgentId, AgentResponse, ExecutionOptions } from "./types.js";

export class CodexAgent extends BaseAgent {
	readonly id: AgentId = "codex";
	readonly displayName = "Codex";
	readonly cliCommand = "codex";

	private readOutputContent(outputFile: string, fallback: string): string {
		if (!existsSync(outputFile)) return fallback;
		try {
			const content = readFileSync(outputFile, "utf-8").trim();
			this.cleanupFile(outputFile);
			return content;
		} catch {
			this.cleanupFile(outputFile);
			return fallback;
		}
	}

	override async execute(options: ExecutionOptions): Promise<AgentResponse> {
		const model = options.model ?? this.getDefaultModel();
		const effectiveTimeout = options.timeout ?? this.getTimeoutForModel(model);
		const outputFile = join(tmpdir(), `codex-output-${randomUUID()}.txt`);
		const analysisLevel = options.analysisLevel ?? this.config.defaultAnalysisLevel ?? "medium";

		const args = [
			"exec",
			"--model",
			model,
			"-c",
			`model_reasoning_effort=${analysisLevel}`,
			"--sandbox",
			"read-only",
			`--output-last-message=${outputFile}`,
			"-",
		];

		logger.info(
			`Executing Codex with model ${model}, analysis level ${analysisLevel} (timeout: ${effectiveTimeout}ms)`,
		);

		const result = await spawnAgent({
			command: this.cliCommand,
			args,
			timeout: effectiveTimeout,
			cwd: options.cwd,
			stdin: options.context ? `${options.context}\n\n${options.prompt}` : options.prompt,
		});

		if (result.timedOut) {
			this.cleanupFile(outputFile);
			return {
				agent: this.id,
				model,
				content: "",
				durationMs: result.durationMs,
				exitCode: 124,
				error: `Timed out after ${effectiveTimeout}ms`,
			};
		}

		const content = this.readOutputContent(outputFile, result.stdout.trim());

		return {
			agent: this.id,
			model,
			content,
			durationMs: result.durationMs,
			exitCode: result.exitCode,
			error: result.exitCode !== 0 ? result.stderr || `Exit code: ${result.exitCode}` : undefined,
		};
	}

	protected buildSpawnOptions(options: ExecutionOptions, model: string): SpawnOptions {
		// Not used directly - execute() is overridden
		return {
			command: this.cliCommand,
			args: ["exec", "-", "--model", model, "--sandbox", "read-only"],
			timeout: options.timeout,
			cwd: options.cwd,
			stdin: options.prompt,
		};
	}

	private cleanupFile(path: string): void {
		try {
			if (existsSync(path)) unlinkSync(path);
		} catch {
			// Ignore cleanup errors
		}
	}
}
