import { describe, expect, test } from "bun:test";
import { validateGithubConfig } from "./github.ts";

describe("validateGithubConfig", () => {
	test("caps repository rows to what fits on the frame", () => {
		expect(validateGithubConfig({ mode: "repository", repo: "a/b", commits: 8, pulls: 2 })).toBeNull();
		expect(validateGithubConfig({ mode: "repository", repo: "a/b", commits: 8, pulls: 3 })).toContain("10 rows");
	});
});
