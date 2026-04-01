# Architecture

## Data Flow

1. CodexBar writes `widget-snapshot.json`
2. The plugin reads the file from disk
3. The snapshot is parsed into a tolerant internal model
4. The selected provider entry is normalized into button state
5. The renderer formats a 3-line key title
6. Stream Deck updates the key display

## Main Components

### `src/store.ts`

Caches the parsed snapshot by file `mtime` so multiple buttons do not repeatedly read the same file.

### `src/snapshot.ts`

Parses the JSON and converts provider entries into internal button state.

### `src/render.ts`

Provider-specific title rendering and remaining-quota transformation.

### `src/actions/usage-button.ts`

Stream Deck action lifecycle:

- `onWillAppear`
- `onDidReceiveSettings`
- `onKeyDown`
- `onWillDisappear`

## Failure Strategy

The plugin does not crash on partial or missing fields. It degrades into explicit user-facing states:

- `No Data`
- `Read Err`
- `No Entry`
- `Compat Err`
- `Stale`

Quota-only entries with `codeReviewRemainingPercent` and/or `creditsRemaining` are still treated as usable and render a quota fallback instead of `Compat Err`.
