# Snapshot Schema

The plugin targets the existing CodexBar widget snapshot.

## Top-level fields

- `generatedAt: string`
- `enabledProviders?: string[]`
- `entries: SnapshotEntry[]`

## Entry fields used by the plugin

- `provider?: string`
- `updatedAt?: string`
- `primary?: { usedPercent?, resetDescription?, windowMinutes?, resetsAt? }`
- `secondary?: { usedPercent?, resetDescription?, windowMinutes?, resetsAt? }`
- `tokenUsage?: { sessionCostUSD?, sessionTokens?, last30DaysCostUSD?, last30DaysTokens? }`
- `dailyUsage?: Array<{ dayKey?, costUSD?, totalTokens? }>`
- `codeReviewRemainingPercent?: number`
- `creditsRemaining?: number`

## Parsing Rules

- Unknown fields are ignored
- Missing `secondary` is allowed
- Missing `tokenUsage` is allowed
- Missing `resetDescription` is allowed
- `codeReviewRemainingPercent` and `creditsRemaining` are treated as usable quota-only fields
- Quota-only entries render a `Review` or `Credits` fallback instead of `Compat Err`
- Missing selected provider entry produces `No Entry`
- Missing all usable provider blocks produces `Compat Err`
