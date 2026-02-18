#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
	logger.info("Starting All-AGENTS-MCP server...");

	const server = createServer();
	const transport = new StdioServerTransport();

	await server.connect(transport);

	logger.info("ALL-AGENTS-MCP server connected via stdio transport");
}

main().catch((err) => {
	logger.error("Fatal error:", err);
	process.exit(1);
});
