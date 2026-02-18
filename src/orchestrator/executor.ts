import { spawn } from "node:child_process";
import { logger } from "../utils/logger.js";

export interface SpawnOptions {
	command: string;
	args: string[];
	timeout?: number;
	cwd?: string;
	env?: Record<string, string | undefined>;
	stdin?: string;
}

export interface SpawnResult {
	stdout: string;
	stderr: string;
	exitCode: number;
	durationMs: number;
	timedOut: boolean;
}

const DEFAULT_TIMEOUT = 120_000; // 2 minutes

function buildSpawnResult(
	stdoutChunks: Buffer[],
	stderr: string,
	startTime: number,
	exitCode: number,
	timedOut: boolean,
): SpawnResult {
	return {
		stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
		stderr,
		exitCode,
		durationMs: Date.now() - startTime,
		timedOut,
	};
}

export async function spawnAgent(options: SpawnOptions): Promise<SpawnResult> {
	const { command, args, timeout = DEFAULT_TIMEOUT, cwd, env, stdin } = options;

	const controller = new AbortController();
	const startTime = Date.now();

	logger.debug(`Spawning: ${command} ${args.join(" ")}`);

	return new Promise<SpawnResult>((resolve) => {
		const child = spawn(command, args, {
			cwd,
			env: env ? { ...process.env, ...env } : process.env,
			signal: controller.signal,
			stdio: [stdin === undefined ? "ignore" : "pipe", "pipe", "pipe"],
		});

		const stdoutChunks: Buffer[] = [];
		const stderrChunks: Buffer[] = [];
		let timedOut = false;

		const timer = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, timeout);

		child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
		child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

		if (stdin !== undefined && child.stdin) {
			child.stdin.end(stdin);
		} else {
			child.stdin?.end();
		}

		child.on("close", (code) => {
			clearTimeout(timer);
			const stderr = Buffer.concat(stderrChunks).toString("utf-8");
			logger.debug(`Process exited: code=${code}, duration=${Date.now() - startTime}ms`);
			resolve(buildSpawnResult(stdoutChunks, stderr, startTime, code ?? 1, timedOut));
		});

		child.on("error", (err) => {
			clearTimeout(timer);
			logger.error(`Process error: ${err.message}`);
			resolve(buildSpawnResult(stdoutChunks, err.message, startTime, 1, timedOut));
		});
	});
}
