# Installation

## Option 1: Build a local installable package

Run:

```bash
npm install
npm run build
npm run validate
npm run pack
```

Then open:

`dist/io.codexbar.usage.streamDeckPlugin`

This imports the packaged plugin into the Stream Deck desktop app.

## Option 2: Link the local development plugin

```bash
npm install
npm run build
npm run link
```

This creates a symlink into:

`~/Library/Application Support/com.elgato.StreamDeck/Plugins/io.codexbar.usage.sdPlugin`

## Stream Deck Setup

1. Open Stream Deck
2. Find the `CodexBar Usage` category
3. Drag `Usage Button` onto a key
4. Choose a provider
5. Confirm the snapshot path

## CodexBar Requirement

CodexBar must already be running and updating:

`~/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json`
