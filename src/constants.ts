import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";

import type { SupportedProvider, UsageButtonSettings } from "./types";

export const CURRENT_APP_GROUP_SNAPSHOT_PATH = `${homedir()}/Library/Group Containers/Y5PE65HELJ.com.steipete.codexbar/widget-snapshot.json`;
export const LEGACY_APP_GROUP_SNAPSHOT_PATH = `${homedir()}/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json`;
export const APP_SUPPORT_SNAPSHOT_PATH = `${homedir()}/Library/Application Support/CodexBar/widget-snapshot.json`;
export const KNOWN_SNAPSHOT_PATHS = [
  CURRENT_APP_GROUP_SNAPSHOT_PATH,
  LEGACY_APP_GROUP_SNAPSHOT_PATH,
  APP_SUPPORT_SNAPSHOT_PATH,
] as const;
export const DEFAULT_SNAPSHOT_PATH = CURRENT_APP_GROUP_SNAPSHOT_PATH;

export const DEFAULT_PROVIDER: SupportedProvider = "codex";
export const DEFAULT_REFRESH_INTERVAL_SEC = 10;
export const DEFAULT_STALE_THRESHOLD_SEC = 600;

export function withDefaults(settings: UsageButtonSettings | undefined): Required<UsageButtonSettings> {
  return {
    provider: settings?.provider ?? DEFAULT_PROVIDER,
    snapshotPath: resolveSnapshotPath(settings?.snapshotPath),
    refreshIntervalSec: normalizeInteger(settings?.refreshIntervalSec, DEFAULT_REFRESH_INTERVAL_SEC, 2, 60),
    staleThresholdSec: normalizeInteger(settings?.staleThresholdSec, DEFAULT_STALE_THRESHOLD_SEC, 30, 3600),
  };
}

export function persistedSettings(settings: UsageButtonSettings | undefined): UsageButtonSettings {
  return {
    provider: settings?.provider ?? DEFAULT_PROVIDER,
    snapshotPath: normalizePath(settings?.snapshotPath),
    refreshIntervalSec: normalizeInteger(settings?.refreshIntervalSec, DEFAULT_REFRESH_INTERVAL_SEC, 2, 60),
    staleThresholdSec: normalizeInteger(settings?.staleThresholdSec, DEFAULT_STALE_THRESHOLD_SEC, 30, 3600),
  };
}

function resolveSnapshotPath(value: string | undefined): string {
  const normalized = normalizePath(value);
  if (!normalized) {
    return preferredKnownSnapshotPath();
  }

  return normalized;
}

function normalizePath(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed === "~") {
    return homedir();
  }

  if (trimmed.startsWith("~/")) {
    return `${homedir()}/${trimmed.slice(2)}`;
  }

  return trimmed;
}

function preferredKnownSnapshotPath(): string {
  const existing = KNOWN_SNAPSHOT_PATHS.flatMap((path, index) => {
    if (!existsSync(path)) {
      return [];
    }

    return [
      {
        path,
        index,
        mtimeMs: statSync(path).mtimeMs,
      },
    ];
  });

  if (existing.length === 0) {
    return DEFAULT_SNAPSHOT_PATH;
  }

  existing.sort((left, right) => {
    if (right.mtimeMs !== left.mtimeMs) {
      return right.mtimeMs - left.mtimeMs;
    }

    return left.index - right.index;
  });
  return existing[0]!.path;
}

function normalizeInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
