import type { ButtonState, SupportedProvider, UsageRowItem } from "./types";

export function renderTitle(state: ButtonState): string {
  if (state.status === "snapshot_missing") {
    return `${providerLabel(state.providerId)}\nNo Data`;
  }

  if (state.status === "snapshot_unreadable") {
    return `${providerLabel(state.providerId)}\nRead Err`;
  }

  if (state.status === "provider_missing") {
    return `${providerLabel(state.providerId)}\nNo Entry`;
  }

  if (state.status === "schema_unsupported") {
    return `${providerLabel(state.providerId)}\nCompat Err`;
  }

  if (hasQuotaOnlyFallback(state)) {
    return renderQuotaOnly(state);
  }

  if (state.usageRows && state.usageRows.length > 0) {
    return renderUsageRows(state);
  }

  if (state.providerId === "codex") {
    return renderCodex(state);
  }

  if (state.providerId === "claude") {
    return renderClaude(state);
  }

  return renderCursor(state);
}

function renderUsageRows(state: ButtonState): string {
  const lines = [providerLabel(state.providerId)];
  for (const row of state.usageRows!.slice(0, 2)) {
    lines.push(`${compactRowTitle(state.providerId, row)} ${remainingText(row.percentLeft)}`);
  }

  return withStatusSuffix(lines, state.status).join("\n");
}

function renderCodex(state: ButtonState): string {
  const lines = [providerLabel(state.providerId)];
  lines.push(`5h ${percentText(state.primaryPercent)}`);

  if (state.secondaryPercent !== undefined) {
    lines.push(`Wk ${percentText(state.secondaryPercent)}`);
  } else if (state.sessionTokens !== undefined) {
    lines.push(shortTokenText(state.sessionTokens));
  } else if (state.primaryResetText) {
    lines.push(shortResetText(state.primaryResetText));
  }

  return withStatusSuffix(lines, state.status).join("\n");
}

function renderClaude(state: ButtonState): string {
  const lines = [providerLabel(state.providerId)];
  lines.push(`Now ${percentText(state.primaryPercent)}`);

  if (state.secondaryPercent !== undefined) {
    lines.push(`2nd ${percentText(state.secondaryPercent)}`);
  } else if (state.primaryResetText) {
    lines.push(shortResetText(state.primaryResetText));
  }

  return withStatusSuffix(lines, state.status).join("\n");
}

function renderCursor(state: ButtonState): string {
  const lines = [providerLabel(state.providerId)];
  lines.push(`Use ${percentText(state.primaryPercent)}`);

  if (state.secondaryPercent !== undefined) {
    lines.push(`2nd ${percentText(state.secondaryPercent)}`);
  } else if (state.primaryResetText) {
    lines.push(shortResetText(state.primaryResetText));
  } else {
    lines.push("No 2nd");
  }

  return withStatusSuffix(lines, state.status).join("\n");
}

function renderQuotaOnly(state: ButtonState): string {
  const lines = [providerLabel(state.providerId)];

  if (state.codeReviewRemainingPercent !== undefined) {
    lines.push(`Review ${state.codeReviewRemainingPercent}%`);
  }

  if (state.creditsRemaining !== undefined) {
    lines.push(`Credits ${state.creditsRemaining}`);
  }

  if (lines.length === 1) {
    lines.push("Quota");
  }

  return withStatusSuffix(lines, state.status).join("\n");
}

function hasQuotaOnlyFallback(state: ButtonState): boolean {
  return (
    state.primaryPercent === undefined &&
    state.secondaryPercent === undefined &&
    state.sessionTokens === undefined &&
    state.sessionCostUSD === undefined &&
    state.last30DaysTokens === undefined &&
    state.last30DaysCostUSD === undefined &&
    state.primaryResetText === undefined &&
    state.secondaryResetText === undefined &&
    (state.codeReviewRemainingPercent !== undefined || state.creditsRemaining !== undefined)
  );
}

function withStatusSuffix(lines: string[], status: ButtonState["status"]): string[] {
  if (status === "snapshot_stale") {
    const updatedLines = [...lines];
    const lastIndex = updatedLines.length - 1;
    updatedLines[lastIndex] = `${updatedLines[lastIndex]} STALE`;
    return updatedLines;
  }

  return lines;
}

function percentText(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  const remaining = Math.max(0, Math.min(100, 100 - Math.round(value)));
  return `${remaining}%`;
}

function remainingText(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  const rounded = Math.max(0, Math.min(100, Math.round(value)));
  return `${rounded}%`;
}

function shortTokenText(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M tok`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K tok`;
  }

  return `${value} tok`;
}

function shortResetText(value: string): string {
  return value.length > 10 ? value.slice(0, 10) : value;
}

function providerLabel(provider: SupportedProvider): string {
  if (provider === "codex") return "Codex";
  if (provider === "claude") return "Claude";
  return "Cursor";
}

function compactRowTitle(provider: SupportedProvider, row: UsageRowItem): string {
  const title = row.title?.trim().toLowerCase() ?? "";
  const id = row.id?.trim().toLowerCase() ?? "";

  if (provider === "codex") {
    if (id === "session" || title === "session") return "5h";
    if (id === "weekly" || title === "weekly") return "Wk";
  }

  if (provider === "claude") {
    if (id === "primary" || title === "session") return "Now";
    if (id === "secondary" || title === "weekly") return "Wk";
    if (id === "tertiary" || title.includes("opus")) return "Opus";
  }

  if (provider === "cursor") {
    if (id === "primary" || title === "total") return "Tot";
    if (id === "secondary" || title === "auto") return "Auto";
    if (id === "tertiary" || title === "api") return "API";
  }

  return shortResetText(row.title ?? "Row");
}
