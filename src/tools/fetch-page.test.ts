import { describe, expect, it } from "vitest";
import { buildFetchPrompt } from "./fetch-page.js";

describe("buildFetchPrompt", () => {
	it("should build prompt with URL only", () => {
		const prompt = buildFetchPrompt("https://example.com/docs");

		expect(prompt).toContain("URL: https://example.com/docs");
		expect(prompt).not.toContain("Additional focus:");
		expect(prompt).toContain("Return ONLY the extracted content");
	});

	it("should include instruction when provided", () => {
		const prompt = buildFetchPrompt("https://example.com/api", "extract only the API table");

		expect(prompt).toContain("URL: https://example.com/api");
		expect(prompt).toContain("Additional focus: extract only the API table");
	});

	it("should include content preservation instructions", () => {
		const prompt = buildFetchPrompt("https://example.com");

		expect(prompt).toContain("Preserve code blocks, tables, lists, and headings");
		expect(prompt).toContain("Remove navigation, ads, footers");
		expect(prompt).toContain("Convert the content to well-formatted Markdown");
	});

	it("should not include additional focus for undefined instruction", () => {
		const prompt = buildFetchPrompt("https://example.com", undefined);

		expect(prompt).not.toContain("Additional focus:");
	});
});
