import { describe, expect, test } from "bun:test";
import { releaseNoteLines, renderReleasesSvg } from "./github-releases.ts";

describe("releaseNoteLines", () => {
	test("reduces markdown to plain text lines", () => {
		const markdown = "## [1.2.0](https://x.y/compare) Highlights\n\n> [!NOTE]\n- **Faster** builds with `bun`\n![logo](a.png)\n";
		expect(releaseNoteLines(markdown)).toEqual(["1.2.0 Highlights", "Faster builds with bun", "logo"]);
	});

	test("handles missing notes", () => {
		expect(releaseNoteLines(null)).toEqual([]);
	});
});

describe("renderReleasesSvg", () => {
	const now = new Date("2026-11-26T12:00:00Z");

	test("draws one card per release with repo, tag and age", () => {
		const svg = renderReleasesSvg(
			[
				{ repo: "a/one", tag: "v1.0.0", lines: ["First"], date: "2026-11-26T06:00:00Z", avatar: null },
				{ repo: "b/two", tag: "v2.0.0", lines: [], date: "2026-11-25T12:00:00Z", avatar: null },
			],
			now,
		);
		expect(svg).toContain("a/one");
		expect(svg).toContain("v2.0.0");
		expect(svg).toContain(">6h<");
		expect(svg).toContain(">1d<");
	});

	test("explains an empty feed", () => {
		expect(renderReleasesSvg([], now)).toContain("No releases");
	});
});
