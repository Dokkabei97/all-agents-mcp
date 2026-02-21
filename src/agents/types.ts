export type AgentId = "claude" | "codex" | "gemini" | "copilot";

export interface IAgent {
	readonly id: AgentId;
	readonly displayName: string;
	readonly cliCommand: string;
	readonly supportsParallelExecution: boolean;

	isAvailable(): Promise<boolean>;
	getModels(): string[];
	getModelConfigs(): ModelConfig[];
	getDefaultModel(): string;
	execute(options: ExecutionOptions): Promise<AgentResponse>;
	healthCheck(): Promise<HealthStatus>;
}

export interface ExecutionOptions {
	prompt: string;
	model?: string;
	timeout?: number;
	cwd?: string;
	context?: string;
	analysisLevel?: "low" | "medium" | "high" | "xhigh";
	sessionId?: string;
}

export interface AgentResponse {
	agent: string;
	model: string;
	content: string;
	durationMs: number;
	exitCode: number;
	error?: string;
}

export interface HealthStatus {
	agent: string;
	available: boolean;
	authenticated: boolean;
	latencyMs?: number;
	error?: string;
}

export interface ModelConfig {
	name: string;
	timeoutSeconds?: number;
}

export interface AgentConfig {
	default: string;
	models: ModelConfig[];
	defaultAnalysisLevel?: "low" | "medium" | "high" | "xhigh";
	defaultTimeoutSeconds?: number;
}
