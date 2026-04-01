export const SUPPORTED_PROVIDERS = ["codex", "claude", "cursor"] as const;

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface UsageWindow {
  usedPercent?: number;
  resetDescription?: string;
  windowMinutes?: number;
  resetsAt?: string;
}

export interface TokenUsage {
  sessionCostUSD?: number;
  sessionTokens?: number;
  last30DaysCostUSD?: number;
  last30DaysTokens?: number;
}

export interface DailyUsageItem {
  dayKey?: string;
  costUSD?: number;
  totalTokens?: number;
}

export interface SnapshotEntry {
  provider?: string;
  updatedAt?: string;
  primary?: UsageWindow;
  secondary?: UsageWindow;
  tokenUsage?: TokenUsage;
  dailyUsage?: DailyUsageItem[];
  codeReviewRemainingPercent?: number;
  creditsRemaining?: number;
}

export interface WidgetSnapshot {
  generatedAt?: string;
  enabledProviders?: string[];
  entries?: SnapshotEntry[];
}

export type UsageStatus =
  | "ok"
  | "provider_missing"
  | "snapshot_missing"
  | "snapshot_unreadable"
  | "snapshot_stale"
  | "schema_unsupported";

export interface UsageButtonSettings {
  provider?: SupportedProvider;
  snapshotPath?: string;
  refreshIntervalSec?: number;
  staleThresholdSec?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ButtonState {
  providerId: SupportedProvider;
  status: UsageStatus;
  generatedAt?: string;
  updatedAt?: string;
  freshnessSeconds?: number;
  primaryPercent?: number;
  secondaryPercent?: number;
  primaryResetText?: string;
  secondaryResetText?: string;
  sessionTokens?: number;
  sessionCostUSD?: number;
  last30DaysTokens?: number;
  last30DaysCostUSD?: number;
  codeReviewRemainingPercent?: number;
  creditsRemaining?: number;
}
