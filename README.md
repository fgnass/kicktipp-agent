# kicktipp-agent

An **autonomous daily betting agent** for [kicktipp](https://www.kicktipp.de) — the German
football prediction game. A scheduled GitHub Actions workflow lets [Claude Code](https://code.claude.com)
place your predictions for you every day, in the cloud, with no local machine running.

Under the hood it drives a kicktipp **CLI / MCP server** (headless Chromium, since kicktipp
has no public API). You can also use that tooling directly — see [Local use](#local-use) — but
the main purpose of this repo is the hands-off agent below.

## What the agent does

Every day the workflow ([`.github/workflows/auto-bet.yml`](.github/workflows/auto-bet.yml)):

1. Logs into kicktipp and finds the current matchday's still-untipped matches.
2. Reads the community's **scoring rules** and picks scorelines that maximize **expected
   points** (not just the most likely result) — using kicktipp's odds, or, when none are
   shown, **looking up live bookmaker odds online**.
3. Adjusts its **risk** by standings: pure expected value early, protect a lead late, take
   contrarian shots when behind.
4. Answers open **bonus questions** (group winners, semifinalists, champion, …) once, with a
   favorites strategy grounded in online outright odds.
5. Places everything via the MCP server and prints a full report.

The strategy is just a prompt — [`.github/auto-bet-prompt.md`](.github/auto-bet-prompt.md) —
so you can tune it without touching code.

## Setup

1. **Fork this repo to GitHub** (scheduled workflows run from your fork's default branch).

2. **Add repository secrets** under *Settings → Secrets and variables → Actions*:

   | Secret | Value |
   |--------|-------|
   | `KICKTIPP_EMAIL` | your kicktipp login email |
   | `KICKTIPP_PASSWORD` | your kicktipp password |
   | `KICKTIPP_COMMUNITY` | your community slug, e.g. `liotipp-26` |
   | `ANTHROPIC_API_KEY` | your Claude API key from [console.anthropic.com](https://console.anthropic.com) |

3. **Try it safely**: *Actions → Auto Bet → Run workflow*. Manual runs default to a **dry run**
   (validates and reports what it *would* place, submits nothing). Uncheck *Dry run* — or wait
   for the daily schedule — to place real bets. Check the `Place bets` step for the report.

### Schedule & cost

- The cron is `0 6 * * *` (06:00 UTC). Edit it in the workflow, or add more entries to run
  several times a day (useful for early kickoffs).
- The job runs on `claude-sonnet-4-6` to keep cost low (a daily run is a handful of small tool
  calls). Switch the `--model` flag to `claude-opus-4-8` for stronger picks, or
  `claude-haiku-4-5` for the cheapest runs.

> **Credentials in CI:** secrets are injected only into the steps that need them, and the MCP
> config (with your password) is written to the ephemeral runner's `$RUNNER_TEMP` (chmod 600)
> and discarded when the job ends. The agent never sees your password — the MCP server uses it
> directly.

## Local use

The same tooling runs locally as a CLI and an MCP server. Install:

```bash
npm install
npx playwright install chromium
npm run build
npm link        # provides the `kicktipp` and `kicktipp-mcp` commands
```

### CLI

On first run the CLI prompts for your kicktipp login and stores it in
`~/.config/kicktipp-agent/config.ini` (chmod 600). Common commands:

| Command | Description |
|---------|-------------|
| `set-community` / `communities` | Choose / list your communities |
| `set-player` / `players` | Set / list your player |
| `today` | Today's matches and which still need bets |
| `bets` / `bet` | Show bets / place bets (interactive, by fixture, or `--bonus`) |
| `leaderboard` / `overview` | Rankings / season overview |
| `schedule` / `table` / `rules` | Fixtures / standings / scoring rules |
| `guide` | Detailed usage guide (useful for LLM agents) |
| `logout` | Remove stored credentials and session |

```bash
kicktipp bet "FC Bayern München vs Borussia Dortmund=2:1" --matchday 5
kicktipp bet --bonus "Who will win the league?=FC Bayern München"
```

### MCP server

`kicktipp-mcp` exposes the same functionality over the [Model Context Protocol](https://modelcontextprotocol.io)
(tools like `get_bets`, `get_rules`, `place_bets`, `get_bonus_questions`, `place_bonus_bets`, …).
Example client config (Claude Desktop / Claude Code):

```json
{
  "mcpServers": {
    "kicktipp": {
      "command": "kicktipp-mcp",
      "env": { "KICKTIPP_EMAIL": "you@example.com", "KICKTIPP_PASSWORD": "yourpassword" }
    }
  }
}
```

Credentials come from the `env` block or the shared `config.ini`. Community, player and site
can also be set via environment (`KICKTIPP_COMMUNITY`, `KICKTIPP_PLAYER`, `KICKTIPP_SITE`),
which is what the CI workflow uses.

## Development

```bash
npm test          # run tests
npm run build     # compile TypeScript
```

## Changes in this fork

Beyond the automation above, this fork adds several fixes/improvements to the underlying
tooling (kept on the `upstream-pr` branch, ready to contribute back upstream):

- **kicktipp.de support + per-community site auto-detection** — German communities only
  render on kicktipp.de (German route names); the tool now detects each community's site
  automatically (kicktipp.de vs kicktipp.com) and remembers it, with `KICKTIPP_SITE` as an
  override. Previously everything was hardcoded to kicktipp.com, so German communities
  silently returned nothing.
- **Group-stage standings** — the league table now parses tournament group tables (e.g. the
  World Cup's 12 groups), not just a single league table.
- **Bonus-answer matching fix** — answers are now matched to their own question, so batching
  several bonus questions in one call no longer mis-assigns picks.
- **Headless/CI ergonomics** — community, player and site are settable via environment
  variables.

## Credits

Originally forked from [schwalle/kicktipp-betbot](https://github.com/schwalle/kicktipp-betbot)
by Stefan, then rewritten in TypeScript with a CLI, MCP server and Cheerio-based parsing.
