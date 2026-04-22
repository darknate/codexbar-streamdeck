# CodexBar Stream Deck

Show your remaining [CodexBar](https://github.com/steipete/CodexBar) quota directly on an Elgato Stream Deck key. 🎛️

This plugin reads [CodexBar](https://github.com/steipete/CodexBar)'s local `widget-snapshot.json` on macOS and renders a compact 3-line status button for:

- `codex`
- `claude`
- `cursor`

It displays **remaining quota**, not used quota. If [CodexBar](https://github.com/steipete/CodexBar) reports `1%` used in a 5-hour window, the key shows `99%`.

## ✨ Why This Exists

[CodexBar](https://github.com/steipete/CodexBar) already writes a local usage snapshot. This plugin turns that file into a Stream Deck button, so you can see your remaining budget without opening another app or browser tab.

No [CodexBar](https://github.com/steipete/CodexBar) fork is required. No API keys are required. No network calls are made. 🔒

## 🧰 What You Need

- macOS
- Stream Deck desktop app
- [CodexBar](https://github.com/steipete/CodexBar) running locally
- Node.js 20 and npm for local build/development

Default snapshot path:

The plugin auto-detects the freshest known CodexBar snapshot path and currently prefers:

- `~/Library/Group Containers/Y5PE65HELJ.com.steipete.codexbar/widget-snapshot.json`
- `~/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json`
- `~/Library/Application Support/CodexBar/widget-snapshot.json`

You can override the path per button in the Stream Deck property inspector.

## 🚀 Quick Start

```bash
npm install
npm run typecheck
npm test
npm run build
npm run validate
npm run link
```

Then in Stream Deck:

1. Add `Usage Button` to a key.
2. Pick `codex`, `claude`, or `cursor`.
3. Confirm the snapshot path if you changed CodexBar's location.

To build an installable plugin bundle locally:

```bash
npm run pack
```

This creates:

`dist/io.codexbar.usage.streamDeckPlugin`

## ✅ Features

- File-based integration with [CodexBar](https://github.com/steipete/CodexBar) 📂
- Per-provider rendering tuned for `codex`, `claude`, and `cursor` 🎯
- Shared snapshot cache across multiple keys ⚡
- Safe handling for missing files, malformed JSON, stale snapshots, and partial schema drift 🛟
- Manual refresh feedback on key press 👆

## 🤖 Use This With a Coding Agent

If you want a coding agent to set this project up on your Mac, copy the prompt from [docs/AGENT_PROMPT.md](docs/AGENT_PROMPT.md).

Short version:

> In this repo on macOS, install dependencies, run typecheck/tests/build/validate, package the Stream Deck plugin, link it into Stream Deck, and tell me exactly what to click in the Stream Deck app to verify the `codex`, `claude`, and `cursor` buttons against the local [CodexBar](https://github.com/steipete/CodexBar) snapshot.

## 📚 Documentation

- [Installation Guide](docs/INSTALL.md)
- [Usage Guide](docs/USAGE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Snapshot Contract](docs/SNAPSHOT_SCHEMA.md)

## 🔐 Security and Privacy

- No credentials are required.
- No API keys are stored.
- The plugin only reads a local JSON file that [CodexBar](https://github.com/steipete/CodexBar) already generates.
- There is no network traffic in the current implementation.

## 📄 License

MIT. See [LICENSE](LICENSE).
