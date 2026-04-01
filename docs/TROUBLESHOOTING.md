# Troubleshooting

## The plugin does not appear in Stream Deck

Run:

```bash
npm run link
```

Then restart Stream Deck or run:

```bash
npm run restart
```

## The key shows `No Data`

Check that CodexBar is running and the snapshot exists:

```bash
ls -l "$HOME/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json"
```

## The key shows `Read Err`

Validate the JSON:

```bash
jq . "$HOME/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json" >/dev/null && echo OK
```

## The key shows `No Entry`

The chosen provider is not present in `entries`.

Inspect the current providers:

```bash
jq '{enabledProviders, providers: (.entries | map(.provider))}' "$HOME/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json"
```

## The key shows `Stale`

CodexBar is not refreshing `generatedAt` often enough for the configured stale threshold.

You can:

- lower expectations and increase `Stale Sec`
- confirm CodexBar is actively updating its snapshot

## `npm install` fails with EACCES on ~/.npm

Use a project-local cache:

```bash
npm install --cache .npm-cache
```

## Validation fails

Run:

```bash
npm run validate
```

Check:

- manifest paths exist
- icons exist
- `bin/plugin.js` exists after build

