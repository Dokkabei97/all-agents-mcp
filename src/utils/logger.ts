type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const currentLevel: LogLevel = (process.env.AA_MCP_LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
	return LEVELS[level] >= LEVELS[currentLevel];
}

function log(level: LogLevel, message: string, ...args: unknown[]): void {
	if (!shouldLog(level)) return;
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
	process.stderr.write(`${prefix} ${message} ${args.length > 0 ? JSON.stringify(args) : ""}\n`);
}

export const logger = {
	debug: (msg: string, ...args: unknown[]) => log("debug", msg, ...args),
	info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
	warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
	error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
};
