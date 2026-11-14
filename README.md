# Dig in — build room

A local, dependency-free TV dashboard for the four agentic-pentester workstreams. Requires Node.js 22+ and Git.

```sh
cd /Users/rehatbir/Developer/SRAM/ap-dashboard
npm start
```

Open http://localhost:4174 on the computer connected to the TV. Click Fullscreen or press F. The responsive layout is designed for a 16:9 screen. It refreshes every 15 seconds and keeps the last data visible with a stale warning if the repository becomes unavailable.

Override the checkout or port with `REPO_PATH=/absolute/path/to/checkout PORT=4175 npm start`. The default checkout is the sibling `agentic-pentester` directory. The server binds only to localhost.

## What the numbers mean

- **Commits:** unique non-merge commits reachable from all local branches and locally stored remote refs. A commit touching several owners counts once for each affected owner, but once in the team total. Shared setup/docs commits may have no owner. Counts are lifetime totals, not a quality score.
- **Momentum:** commits with a committer timestamp in the last hour. Sparklines cover 24 hours.
- **Scope:** equal-weight requirements derived from `docs/handoffs/01..04`. `scope.mjs` defines transparent, editable source-pattern signals per requirement. Matching one of two signals yields half the requirement's points. The overall estimate averages the four workstreams. Scores are scaled to a maximum of 90%, reserving the rest for integration verification. This app does not run tests or certify completion.
- **Evidence:** current working-tree source, including uncommitted and nonignored untracked files. Tests, fixtures, generated files, large files and symlinks are excluded. Some lab setup/reset requirements intentionally inspect documentation. Comments or similar names may produce false positives; alternative implementations may produce false negatives. View scope shows the contributing paths.
- **WIP:** changed and untracked nonignored files in this checkout, attributed by ownership.

Commit activity includes locally available remote refs, while scope evidence describes **only the selected working checkout**. Changes on teammates' machines are invisible until available locally. The dashboard fetches every configured remote on startup and about once a minute while the page is open, explicitly including all remote branches. Shared commit hashes count once in the team total. It never pulls, merges, checks out branches, changes working files or runs project code. Scope estimates still use the selected checkout, so merge implementation when ready for its scope evidence to appear. Fetch failures show a warning and retain locally available data; existing Git authentication is used without interactive prompts. No GitHub credentials or external services are needed.

Edit names, path ownership and milestone detection in `scope.mjs` and restart the server. Estimates are deliberately labeled, not presented as tested completion. No manual progress override is built in.

## Verification

`npm test` exercises ownership, multi-owner commit parsing and scope scoring. The HTTP endpoint is `GET /api/progress`. No project code is imported or executed.
