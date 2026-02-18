import type { SpawnOptions } from "../orchestrator/executor.js";
import { BaseAgent } from "./base-agent.js";
import type { AgentConfig, AgentId, ExecutionOptions } from "./types.js";

export class GeminiAgent extends BaseAgent {
	readonly id: AgentId = "gemini";
	readonly displayName = "Gemini CLI";
	readonly cliCommand = "gemini";

	protected buildSpawnOptions(options: ExecutionOptions, model: string): SpawnOptions {
		const args = ["-m", model, "-p", options.prompt, "--output-format", "stream-json", "--sandbox"];

		return {
			command: this.cliCommand,
			args,
			timeout: options.timeout,
			cwd: options.cwd,
			stdin: options.context,
		};
	}

	protected override parseOutput(stdout: string, _stderr: string): string {
		// stream-json outputs newline-delimited JSON objects
		// Extract text content from the stream
		const lines = stdout.trim().split("\n");
		const textParts: string[] = [];

		for (const line of lines) {
			try {
				const obj = JSON.parse(line);
				if (obj.text) textParts.push(obj.text);
				else if (obj.response) textParts.push(obj.response);
				else if (obj.content) textParts.push(obj.content);
			} catch {
				// Not JSON, collect as raw text
				if (line.trim()) textParts.push(line);
			}
		}

		return textParts.join("") || stdout.trim();
	}
}
