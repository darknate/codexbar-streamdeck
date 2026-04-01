import { readFile } from "node:fs/promises";

import type { ButtonState, SnapshotEntry, SupportedProvider, WidgetSnapshot } from "./types";

export function parseSnapshot(raw: string): WidgetSnapshot {
  const parsed = JSON.parse(raw) as WidgetSnapshot;

  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.entries)) {
    throw new Error("Snapshot root must contain an entries array");
  }

  return parsed;
}

export async function readSnapshot(snapshotPath: string): Promise<WidgetSnapshot> {
  const raw = await readFile(snapshotPath, "utf8");
  return parseSnapshot(raw);
}

export function buildState(
  snapshot: WidgetSnapshot,
  provider: SupportedProvider,
  now: Date,
  staleThresholdSec: number,
): ButtonState {
  const generatedAt = snapshot.generatedAt;
  const generatedAtDate = generatedAt ? new Date(generatedAt) : undefined;
  const freshnessSeconds =
    generatedAtDate && Number.isFinite(generatedAtDate.valueOf())
      ? Math.max(0, Math.floor((now.valueOf() - generatedAtDate.valueOf()) / 1000))
      : undefined;

  const entry = snapshot.entries?.find((candidate) => candidate.provider === provider);
  if (!entry) {
    return {
      providerId: provider,
      status: "provider_missing",
      generatedAt,
      freshnessSeconds,
    };
  }

  const hasUsableFields = Boolean(
    entry.primary ||
      entry.secondary ||
      entry.tokenUsage ||
      entry.codeReviewRemainingPercent !== undefined ||
      entry.creditsRemaining !== undefined,
  );
  if (!hasUsableFields) {
    return {
      providerId: provider,
      status: "schema_unsupported",
      generatedAt,
      updatedAt: entry.updatedAt,
      freshnessSeconds,
    };
  }

  const status = freshnessSeconds !== undefined && freshnessSeconds > staleThresholdSec ? "snapshot_stale" : "ok";
  return mergeEntry(provider, status, generatedAt, freshnessSeconds, entry);
}

function mergeEntry(
  providerId: SupportedProvider,
  status: ButtonState["status"],
  generatedAt: string | undefined,
  freshnessSeconds: number | undefined,
  entry: SnapshotEntry,
): ButtonState {
  return {
    providerId,
    status,
    generatedAt,
    updatedAt: entry.updatedAt,
    freshnessSeconds,
    primaryPercent: entry.primary?.usedPercent,
    secondaryPercent: entry.secondary?.usedPercent,
    primaryResetText: entry.primary?.resetDescription,
    secondaryResetText: entry.secondary?.resetDescription,
    sessionTokens: entry.tokenUsage?.sessionTokens,
    sessionCostUSD: entry.tokenUsage?.sessionCostUSD,
    last30DaysTokens: entry.tokenUsage?.last30DaysTokens,
    last30DaysCostUSD: entry.tokenUsage?.last30DaysCostUSD,
    codeReviewRemainingPercent: entry.codeReviewRemainingPercent,
    creditsRemaining: entry.creditsRemaining,
  };
}
