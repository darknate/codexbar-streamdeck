# Prompt for a Coding Agent

Use this prompt if you want an agent to set up and validate the plugin locally on a Mac:

```text
You are in the `codexbar-streamdeck` repository on macOS.

Goal: get the Stream Deck plugin built and locally testable against CodexBar's existing widget snapshot.

Do the following:
1. Inspect the repo structure and confirm the main build/test commands from package.json.
2. Install dependencies with npm.
3. Run:
   - npm run typecheck
   - npm test
   - npm run build
   - npm run validate
4. Package the plugin with `npm run pack`.
5. Link the local plugin into Stream Deck with `npm run link` if Stream Deck is installed.
6. Confirm whether this snapshot file exists:
   ~/Library/Group Containers/group.com.steipete.codexbar/widget-snapshot.json
7. If the snapshot exists, tell me exactly how to verify all three providers in the Stream Deck UI:
   - codex
   - claude
   - cursor
8. If something fails, explain the failure precisely and propose the smallest fix.

Constraints:
- Do not invent missing files or paths.
- Do not claim the plugin works unless typecheck, tests, build, and validate actually pass.
- Keep changes minimal and repo-appropriate.
- Prefer editing docs and config over changing behavior unless a real bug is found.
```
