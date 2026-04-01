# Contributing

## Requirements

- Node.js 20
- npm 10+
- Stream Deck desktop app for manual testing
- CodexBar running locally on macOS for end-to-end validation

## Development Loop

```bash
npm install
npm run typecheck
npm test
npm run build
npm run validate
```

## Manual Verification

1. Link the plugin with `npm run link`
2. Add `Usage Button` to a Stream Deck key
3. Point it at a real CodexBar snapshot
4. Verify `codex`, `claude`, and `cursor`
5. Verify missing-file and missing-provider states

## Pull Request Expectations

- Keep changes scoped
- Preserve tolerant parsing for snapshot schema drift
- Add or update tests for parsing/rendering changes
- Re-run `typecheck`, `test`, `build`, and `validate`
- Update docs when behavior or setup changes

