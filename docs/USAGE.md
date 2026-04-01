# Usage

## Supported Providers

- `codex`
- `claude`
- `cursor`

## Property Inspector Settings

### Provider

Chooses which provider entry to read from the snapshot.

### Snapshot Path

Override the default snapshot path if needed.

Default:

`~/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json`

### Refresh Sec

How often the plugin rechecks the snapshot file.

Default: `10`

### Stale Sec

How old `generatedAt` can be before the snapshot is shown as stale.

Default: `600`

## Display Behavior

The plugin shows **remaining quota**.

Examples:

- if `primary.usedPercent = 1`, the key shows `99%`
- if `secondary.usedPercent = 26`, the key shows `74%`

### Codex

- line 1: `Codex`
- line 2: `5h <remaining>`
- line 3: `Wk <remaining>` or fallback metadata

### Claude

- line 1: `Claude`
- line 2: `Now <remaining>`
- line 3: `2nd <remaining>` or reset text

### Cursor

- line 1: `Cursor`
- line 2: `Use <remaining>`
- line 3: `2nd <remaining>` or fallback text

### Quota-only entries

- if `codeReviewRemainingPercent` is present without the normal usage windows, the key shows `Review <remaining>`
- if `creditsRemaining` is present without the normal usage windows, the key shows `Credits <value>`
