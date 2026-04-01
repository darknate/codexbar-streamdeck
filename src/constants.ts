import { homedir } from "node:os";

import type { SupportedProvider, UsageButtonSettings } from "./types";

export const DEFAULT_SNAPSHOT_PATH = `${homedir()}/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json`;

export const DEFAULT_PROVIDER: SupportedProvider = "codex";
export const DEFAULT_REFRESH_INTERVAL_SEC = 10;
export const DEFAULT_STALE_THRESHOLD_SEC = 600;

export function withDefaults(settings: UsageButtonSettings | undefined): Required<UsageButtonSettings> {
  return {
    provider: settings?.provider ?? DEFAULT_PROVIDER,
    snapshotPath: normalizePath(settings?.snapshotPath),
    refreshIntervalSec: normalizeInteger(settings?.refreshIntervalSec, DEFAULT_REFRESH_INTERVAL_SEC, 2, 60),
    staleThresholdSec: normalizeInteger(settings?.staleThresholdSec, DEFAULT_STALE_THRESHOLD_SEC, 30, 3600),
  };
}

function normalizePath(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_SNAPSHOT_PATH;
  }

  if (trimmed === "~") {
    return homedir();
  }

  if (trimmed.startsWith("~/")) {
    return `${homedir()}/${trimmed.slice(2)}`;
  }

  return trimmed;
}

function normalizeInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
