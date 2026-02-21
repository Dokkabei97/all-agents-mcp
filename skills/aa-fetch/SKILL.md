---
name: aa-fetch
description: Fetch web page content via Gemini CLI
argument-hint: <url> [instruction]
---

# Fetch Page

User wants to fetch and extract content from a web URL using Gemini CLI's native browsing capability.

## Instructions

1. Parse the user's input to extract the **URL** and optional **instruction**.
   - The first argument is the URL (must be a valid URL)
   - Everything after the URL is the extraction instruction (optional)
   - If no URL is provided, ask the user for the target URL

2. Call the MCP tool `mcp__all-agents-mcp__fetch_page` with:
   - `url`: the target URL
   - `instruction` (optional): extraction/focus instruction from the user
   - `model` (optional): defaults to `gemini-3-flash-preview` for speed

3. Display the response as-is. The tool returns formatted markdown with the fetched content.

## Examples

- `/all-agents-mcp:aa-fetch https://docs.example.com/api`
- `/all-agents-mcp:aa-fetch https://example.com/pricing extract only the pricing table`
- `/all-agents-mcp:aa-fetch https://github.com/repo/README.md summarize the key features`
