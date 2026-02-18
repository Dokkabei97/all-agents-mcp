import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Session, SessionEntry } from "./types.js";

const SESSION_DIR = join(homedir(), ".all-agents-mcp", "sessions");

function ensureDir(): void {
	mkdirSync(SESSION_DIR, { recursive: true });
}

function sessionPath(id: string): string {
	return join(SESSION_DIR, `${id}.json`);
}

export function createSession(): Session {
	ensureDir();
	const session: Session = {
		id: randomUUID(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		entries: [],
	};
	writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2));
	return session;
}

export function getSession(id: string): Session | null {
	const path = sessionPath(id);
	if (!existsSync(path)) return null;
	try {
		return JSON.parse(readFileSync(path, "utf-8")) as Session;
	} catch {
		return null;
	}
}

export function addEntry(sessionId: string, entry: Omit<SessionEntry, "id" | "timestamp">): void {
	const session = getSession(sessionId);
	if (!session) return;

	session.entries.push({
		...entry,
		id: randomUUID(),
		timestamp: new Date().toISOString(),
	});
	session.updatedAt = new Date().toISOString();
	writeFileSync(sessionPath(sessionId), JSON.stringify(session, null, 2));
}

export function listSessions(): Array<{ id: string; createdAt: string; entryCount: number }> {
	ensureDir();
	const files = readdirSync(SESSION_DIR).filter((f) => f.endsWith(".json"));
	return files.map((f) => {
		try {
			const session = JSON.parse(readFileSync(join(SESSION_DIR, f), "utf-8")) as Session;
			return {
				id: session.id,
				createdAt: session.createdAt,
				entryCount: session.entries.length,
			};
		} catch {
			return { id: f.replace(".json", ""), createdAt: "", entryCount: 0 };
		}
	});
}

// Active session management
let activeSessionId: string | null = null;

export function getOrCreateActiveSession(): string {
	if (activeSessionId) return activeSessionId;
	const session = createSession();
	activeSessionId = session.id;
	return activeSessionId;
}
