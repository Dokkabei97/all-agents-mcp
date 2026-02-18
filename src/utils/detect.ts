import which from "which";
import type { AgentId } from "../agents/types.js";

const CALLER_ENV_MAP: Record<string, AgentId> = {
	CLAUDECODE: "claude",
	CODEX_SANDBOX_TYPE: "codex",
	GEMINI_CLI: "gemini",
	COPILOT_CLI: "copilot",
};

export function detectCaller(): AgentId | null {
	// 1. CLI argument check
	const callerArg = process.argv.find((arg) => arg.startsWith("--caller="));
	if (callerArg) {
		const caller = callerArg.split("=")[1] as AgentId;
		if (["claude", "codex", "gemini", "copilot"].includes(caller)) {
			return caller;
		}
	}

	// 2. Environment variable check
	for (const [envVar, agentId] of Object.entries(CALLER_ENV_MAP)) {
		if (process.env[envVar]) {
			return agentId;
		}
	}

	// 3. process.env._ fallback (last executed command)
	const lastCmd = process.env._ ?? "";
	if (lastCmd.includes("claude")) return "claude";
	if (lastCmd.includes("codex")) return "codex";
	if (lastCmd.includes("gemini")) return "gemini";
	if (lastCmd.includes("copilot")) return "copilot";

	return null;
}

export async function isCliAvailable(command: string): Promise<boolean> {
	try {
		await which(command);
		return true;
	} catch {
		return false;
	}
}
