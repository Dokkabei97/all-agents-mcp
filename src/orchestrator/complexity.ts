export type ComplexityLevel = "simple" | "complex" | "large";

export interface ComplexityResult {
	level: ComplexityLevel;
	score: number;
	reasons: string[];
}

const LARGE_KEYWORDS = [
	"전체",
	"모든 파일",
	"리팩터링",
	"마이그레이션",
	"all files",
	"entire",
	"refactor",
	"migration",
	"전부",
	"프로젝트 전체",
	"complete",
	"overhaul",
];

const COMPLEX_KEYWORDS = [
	"분석",
	"비교",
	"최적화",
	"아키텍처",
	"analyze",
	"compare",
	"optimize",
	"architecture",
	"설계",
	"검토",
	"review",
	"design",
];

const MULTI_TASK_MARKERS = [
	/\d+\.\s/g, // numbered lists
	/[-*]\s/g, // bullet lists
	/그리고|또한|추가로/g, // Korean conjunctions
	/and also|additionally|furthermore/gi,
];

export function analyzeComplexity(task: string): ComplexityResult {
	let score = 0;
	const reasons: string[] = [];

	// Prompt length
	if (task.length > 1000) {
		score += 3;
		reasons.push("Long prompt (>1000 chars)");
	} else if (task.length > 500) {
		score += 1;
		reasons.push("Medium prompt (>500 chars)");
	}

	// Large task keywords
	for (const keyword of LARGE_KEYWORDS) {
		if (task.toLowerCase().includes(keyword.toLowerCase())) {
			score += 3;
			reasons.push(`Large task keyword: "${keyword}"`);
		}
	}

	// Complex task keywords
	for (const keyword of COMPLEX_KEYWORDS) {
		if (task.toLowerCase().includes(keyword.toLowerCase())) {
			score += 1;
			reasons.push(`Complex keyword: "${keyword}"`);
		}
	}

	// Multi-task markers
	for (const pattern of MULTI_TASK_MARKERS) {
		const matches = task.match(pattern);
		if (matches && matches.length >= 2) {
			score += 2;
			reasons.push(`Multiple sub-tasks detected (${matches.length})`);
		}
	}

	// File/directory references
	const filePatterns = task.match(/[\w/.-]+\.\w{1,5}/g);
	if (filePatterns && filePatterns.length > 3) {
		score += 2;
		reasons.push(`Multiple file references (${filePatterns.length})`);
	}

	let level: ComplexityLevel;
	if (score >= 6) {
		level = "large";
	} else if (score >= 3) {
		level = "complex";
	} else {
		level = "simple";
	}

	return { level, score, reasons };
}
