import { stat } from "node:fs/promises";

import { readSnapshot } from "./snapshot";
import type { WidgetSnapshot } from "./types";

interface CacheEntry {
  mtimeMs: number;
  snapshot: WidgetSnapshot;
}

export class SnapshotStore {
  private readonly cache = new Map<string, CacheEntry>();

  async getSnapshot(snapshotPath: string): Promise<WidgetSnapshot> {
    const cached = this.cache.get(snapshotPath);
    let fileStat;

    try {
      fileStat = await stat(snapshotPath);
    } catch (error) {
      if (cached) {
        return cached.snapshot;
      }

      throw error;
    }

    if (cached && cached.mtimeMs === fileStat.mtimeMs) {
      return cached.snapshot;
    }

    let snapshot: WidgetSnapshot;
    try {
      snapshot = await readSnapshot(snapshotPath);
    } catch (error) {
      if (cached) {
        return cached.snapshot;
      }

      throw error;
    }

    this.cache.set(snapshotPath, {
      mtimeMs: fileStat.mtimeMs,
      snapshot,
    });
    return snapshot;
  }
}
