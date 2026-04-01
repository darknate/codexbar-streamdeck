import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildState, parseSnapshot } from "../src/snapshot";
import { renderTitle } from "../src/render";

function loadFixture(name: string) {
  const raw = readFileSync(join(import.meta.dirname, "fixtures", name), "utf8");
  return parseSnapshot(raw);
}

describe("snapshot parsing", () => {
  it("parses the live widget snapshot shape", () => {
    const snapshot = loadFixture("widget-snapshot.json");

    expect(snapshot.entries).toHaveLength(3);
    expect(snapshot.enabledProviders).toContain("codex");
  });

  it("builds a codex state with both windows and token usage", () => {
    const snapshot = loadFixture("widget-snapshot.json");
    const state = buildState(snapshot, "codex", new Date("2026-03-21T09:30:00Z"), 600);

    expect(state.status).toBe("ok");
    expect(state.primaryPercent).toBe(8);
    expect(state.secondaryPercent).toBe(26);
    expect(state.sessionTokens).toBe(3169819);
    expect(renderTitle(state)).toContain("5h 92%");
    expect(renderTitle(state)).toContain("Wk 74%");
  });

  it("renders a quota-only codex state from codeReviewRemainingPercent", () => {
    const snapshot = loadFixture("widget-snapshot.json");
    const quotaOnlySnapshot = {
      ...snapshot,
      entries: snapshot.entries?.map((entry) =>
        entry.provider === "codex"
          ? {
              provider: "codex",
              updatedAt: entry.updatedAt,
              codeReviewRemainingPercent: 99,
            }
          : entry,
      ),
    };
    const state = buildState(quotaOnlySnapshot, "codex", new Date("2026-03-21T09:30:00Z"), 600);

    expect(state.status).toBe("ok");
    expect(state.primaryPercent).toBeUndefined();
    expect(state.codeReviewRemainingPercent).toBe(99);
    expect(renderTitle(state)).toContain("Review 99%");
  });

  it("renders a quota-only codex state from creditsRemaining", () => {
    const snapshot = loadFixture("widget-snapshot.json");
    const quotaOnlySnapshot = {
      ...snapshot,
      entries: snapshot.entries?.map((entry) =>
        entry.provider === "codex"
          ? {
              provider: "codex",
              updatedAt: entry.updatedAt,
              creditsRemaining: 12,
            }
          : entry,
      ),
    };
    const state = buildState(quotaOnlySnapshot, "codex", new Date("2026-03-21T09:30:00Z"), 600);

    expect(state.status).toBe("ok");
    expect(state.primaryPercent).toBeUndefined();
    expect(state.creditsRemaining).toBe(12);
    expect(renderTitle(state)).toContain("Credits 12");
  });

  it("builds a provider missing state when the entry is absent", () => {
    const snapshot = loadFixture("widget-snapshot.json");
    const state = buildState(
      {
        ...snapshot,
        entries: snapshot.entries?.filter((entry) => entry.provider !== "cursor"),
      },
      "cursor",
      new Date("2026-03-21T09:30:00Z"),
      600,
    );

    expect(state.status).toBe("provider_missing");
    expect(renderTitle(state)).toContain("No Entry");
  });

  it("marks a snapshot stale when generatedAt is too old", () => {
    const snapshot = loadFixture("widget-snapshot.json");
    const staleSnapshot = { ...snapshot, generatedAt: "2026-03-21T09:00:00Z" };
    const state = buildState(staleSnapshot, "codex", new Date("2026-03-21T09:30:00Z"), 600);

    expect(state.status).toBe("snapshot_stale");
    expect(renderTitle(state)).toContain("Stale");
  });

  it("throws on malformed root shape", () => {
    expect(() => parseSnapshot("{\"generatedAt\":\"2026-03-21T09:25:39Z\"}")).toThrow(
      "Snapshot root must contain an entries array",
    );
  });
});
