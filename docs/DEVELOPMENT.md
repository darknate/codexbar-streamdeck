# Development

## Tooling

- Node.js 20
- npm
- TypeScript
- Rollup
- Vitest
- Elgato CLI

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
npm run validate
npm run pack
npm run link
npm run restart
```

## Local Workflow

1. Edit source files in `src/`
2. Run `npm run typecheck`
3. Run `npm test`
4. Run `npm run build`
5. Run `npm run restart`
6. Re-check the key in Stream Deck

## Notes

- The action images are intentionally minimal and neutral.
- The plugin is currently macOS-only because the CodexBar snapshot path is macOS-specific.

