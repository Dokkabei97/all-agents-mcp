export interface SessionEntry {
	id: string;
	timestamp: string;
	tool: string;
	agent: string;
	model: string;
	prompt: string;
	response: string;
	durationMs: number;
	exitCode: number;
	error?: string;
}

export interface Session {
	id: string;
	createdAt: string;
	updatedAt: string;
	entries: SessionEntry[];
}
