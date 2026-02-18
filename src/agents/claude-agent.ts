import type { SpawnOptions } from "../orchestrator/executor.js";
import { BaseAgent } from "./base-agent.js";
import type { AgentConfig, AgentId, ExecutionOptions } from "./types.js";

export class ClaudeAgent extends BaseAgent {
	readonly id: AgentId = "claude";
	readonly displayName = "Claude Code";
	readonly cliCommand = "claude";

	protected buildSpawnOptions(options: ExecutionOptions, model: string): SpawnOptions {
		const args = ["-p", options.prompt, "--output-format", "json", "--model", model];

		return {
			command: this.cliCommand,
			args,
			timeout: options.timeout,
			cwd: options.cwd,
			env: {
				// Prevent recursive MCP calls
				CLAUDECODE: "",
			},
			stdin: options.context,
		};
	}

	protected override parseOutput(stdout: string, stderr: string): string {
		try {
			const parsed = JSON.parse(stdout);
			if (parsed.result) return parsed.result;
			if (typeof parsed === "string") return parsed;
			return JSON.stringify(parsed, null, 2);
		} catch {
			return stdout.trim() || stderr.trim();
		}
	}
}
