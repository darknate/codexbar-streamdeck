import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { withDefaults } from "../src/constants";
import { SnapshotStore } from "../src/store";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "codexbar-streamdeck-"));
  tempDirs.push(dir);
  return dir;
}

function goodSnapshotJson(): string {
  return JSON.stringify({
    generatedAt: "2026-03-21T09:25:39Z",
    enabledProviders: ["codex"],
    entries: [
      {
        provider: "codex",
        updatedAt: "2026-03-21T09:25:39Z",
        primary: {
          usedPercent: 8,
          windowMinutes: 300,
        },
      },
    ],
  });
}

describe("settings normalization", () => {
  it("expands a tilde-prefixed snapshot path", () => {
    const defaults = withDefaults({
      provider: "codex",
      snapshotPath: "~/Library/test/widget-snapshot.json",
      refreshIntervalSec: 10,
      staleThresholdSec: 600,
    });

    expect(defaults.snapshotPath.startsWith("/")).toBe(true);
    expect(defaults.snapshotPath).toContain("/Library/test/widget-snapshot.json");
  });
});

describe("snapshot store", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it("returns the cached snapshot when a refresh read fails", async () => {
    const dir = makeTempDir();
    const snapshotPath = join(dir, "widget-snapshot.json");
    const store = new SnapshotStore();

    writeFileSync(snapshotPath, goodSnapshotJson(), "utf8");
    const first = await store.getSnapshot(snapshotPath);

    await new Promise((resolve) => setTimeout(resolve, 20));
    writeFileSync(snapshotPath, "{\"generatedAt\":\"2026-03-21T09:26:00Z\"", "utf8");

    const second = await store.getSnapshot(snapshotPath);

    expect(second).toEqual(first);
  });

  it("returns the cached snapshot while the file is temporarily missing, then reloads the replacement snapshot", async () => {
    const dir = makeTempDir();
    const snapshotPath = join(dir, "widget-snapshot.json");
    const store = new SnapshotStore();

    const firstSnapshot = goodSnapshotJson();
    const secondSnapshot = JSON.stringify({
      generatedAt: "2026-03-21T09:26:00Z",
      enabledProviders: ["codex"],
      entries: [
        {
          provider: "codex",
          updatedAt: "2026-03-21T09:26:00Z",
          primary: {
            usedPercent: 12,
            windowMinutes: 300,
          },
        },
      ],
    });

    writeFileSync(snapshotPath, firstSnapshot, "utf8");
    const first = await store.getSnapshot(snapshotPath);

    unlinkSync(snapshotPath);
    const duringGap = await store.getSnapshot(snapshotPath);
    expect(duringGap).toEqual(first);

    await new Promise((resolve) => setTimeout(resolve, 20));
    writeFileSync(snapshotPath, secondSnapshot, "utf8");
    const afterReplace = await store.getSnapshot(snapshotPath);
    if (!afterReplace.entries) {
      throw new Error("Expected entries in replacement snapshot");
    }

    expect(afterReplace.entries).toHaveLength(1);
    expect(afterReplace.generatedAt).toBe("2026-03-21T09:26:00Z");
    expect(afterReplace.entries[0]?.primary?.usedPercent).toBe(12);
  });
});
