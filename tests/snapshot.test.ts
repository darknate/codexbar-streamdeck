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
    expect(renderTitle(state)).toContain("STALE");
  });

  it("throws on malformed root shape", () => {
    expect(() => parseSnapshot("{\"generatedAt\":\"2026-03-21T09:25:39Z\"}")).toThrow(
      "Snapshot root must contain an entries array",
    );
  });

  it("renders the current CodexBar usageRows schema", () => {
    const snapshot = parseSnapshot(
      JSON.stringify({
        generatedAt: "2026-04-22T10:22:01Z",
        enabledProviders: ["codex", "claude", "cursor"],
        entries: [
          {
            provider: "codex",
            updatedAt: "2026-04-22T10:22:00Z",
            primary: {
              usedPercent: 0,
              windowMinutes: 300,
              resetDescription: "16:25",
            },
            secondary: {
              usedPercent: 1,
              windowMinutes: 10080,
              resetDescription: "28. Apr 2026 at 20:24",
            },
            usageRows: [
              { id: "session", title: "Session", percentLeft: 100 },
              { id: "weekly", title: "Weekly", percentLeft: 99 },
            ],
          },
          {
            provider: "cursor",
            updatedAt: "2026-04-22T10:22:00Z",
            primary: {
              usedPercent: 0.5025641025641026,
              resetDescription: "Resets Apr 23 at 2:44PM",
            },
            secondary: {
              usedPercent: 0.6533333333333333,
              resetDescription: "Resets Apr 23 at 2:44PM",
            },
            tertiary: {
              usedPercent: 0,
              resetDescription: "Resets Apr 23 at 2:44PM",
            },
            usageRows: [
              { id: "primary", title: "Total", percentLeft: 99.49743589743589 },
              { id: "secondary", title: "Auto", percentLeft: 99.34666666666666 },
              { id: "tertiary", title: "API", percentLeft: 100 },
            ],
          },
        ],
      }),
    );

    const codexState = buildState(snapshot, "codex", new Date("2026-04-22T10:23:00Z"), 600);
    const cursorState = buildState(snapshot, "cursor", new Date("2026-04-22T10:23:00Z"), 600);

    expect(renderTitle(codexState)).toContain("5h 100%");
    expect(renderTitle(codexState)).toContain("Wk 99%");
    expect(cursorState.tertiaryPercent).toBe(0);
    expect(renderTitle(cursorState)).toContain("Tot 99%");
    expect(renderTitle(cursorState)).toContain("Auto 99%");
  });
});
