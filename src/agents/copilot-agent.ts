import type { SpawnOptions } from "../orchestrator/executor.js";
import { BaseAgent } from "./base-agent.js";
import type { AgentConfig, AgentId, ExecutionOptions } from "./types.js";

export class CopilotAgent extends BaseAgent {
	readonly id: AgentId = "copilot";
	readonly displayName = "Copilot CLI";
	readonly cliCommand = "copilot";
	override readonly supportsParallelExecution = false;

	protected buildSpawnOptions(options: ExecutionOptions, model: string): SpawnOptions {
		const args = [
			"--model",
			model,
			"-p",
			options.prompt,
			"--allow-all-tools",
			"--silent",
			"--no-ask-user",
			"--no-custom-instructions",
			"--disable-builtin-mcps",
		];

		return {
			command: this.cliCommand,
			args,
			timeout: options.timeout,
			cwd: options.cwd,
			stdin: options.context,
		};
	}

	protected override parseOutput(stdout: string, stderr: string): string {
		return stdout.trim() || stderr.trim();
	}
}
