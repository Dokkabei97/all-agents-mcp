import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAgentHealthTool } from "./tools/agent-health.js";
// Tools
import { registerAskAgentTool } from "./tools/ask-agent.js";
import { registerAskAllTool } from "./tools/ask-all.js";
import { registerCollaborateTool } from "./tools/collaborate.js";
import { registerDebugWithTool } from "./tools/debug-with.js";
import { registerDelegateTaskTool } from "./tools/delegate.js";
import { registerExplainWithTool } from "./tools/explain-with.js";
import { registerFetchPageTool } from "./tools/fetch-page.js";
import { registerGenerateTestTool } from "./tools/generate-test.js";
import { registerListAgentsTool } from "./tools/list-agents.js";
import { registerListModelsTool } from "./tools/list-models.js";
import { registerRefactorWithTool } from "./tools/refactor-with.js";
import { registerReviewCodeTool } from "./tools/review-code.js";
import { registerVerifyTool } from "./tools/verify.js";

import { registerAgentStatusResource } from "./resources/agent-status.js";
import { registerSessionHistoryResource } from "./resources/session-history.js";
// Resources
import { registerSessionsListResource } from "./resources/sessions-list.js";

export function createServer(): McpServer {
	const server = new McpServer({
		name: "all-agents-mcp",
		version: "1.0.0",
	});

	// Register 14 tools
	registerAskAgentTool(server);
	registerAskAllTool(server);
	registerDelegateTaskTool(server);
	registerCollaborateTool(server);
	registerVerifyTool(server);
	registerReviewCodeTool(server);
	registerDebugWithTool(server);
	registerExplainWithTool(server);
	registerFetchPageTool(server);
	registerGenerateTestTool(server);
	registerRefactorWithTool(server);
	registerListAgentsTool(server);
	registerListModelsTool(server);
	registerAgentHealthTool(server);

	// Register 3 resources
	registerSessionsListResource(server);
	registerSessionHistoryResource(server);
	registerAgentStatusResource(server);

	return server;
}
