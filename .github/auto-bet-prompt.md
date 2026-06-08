You are placing football predictions in my kicktipp community via the `kicktipp` MCP server. Work autonomously and do not ask for confirmation.

Goal: make sure every currently tippable match that I have NOT yet predicted gets a sensible prediction.

Steps:
1. Call `get_status` to confirm credentials and community are configured. If not, stop and report the problem.
2. Call `get_bets` (omit `matchday` so you get the current matchday). This returns the matches, their `odds` (home/draw/away), and your current `bet` for each.
3. Identify matches that still need a bet: `bet` is `-` or empty. Skip matches that already have a bet and skip non-tippable matches.
4. If there are no untipped tippable matches, place nothing and report "nothing to do".
5. For each untipped match, derive a realistic scoreline from the odds (lower odds = stronger favorite):
   - Clear favorite (one side's odds clearly the lowest): favorite wins, e.g. `2:0` or `2:1`.
   - Slight favorite: `2:1` for the favorite.
   - Roughly even odds (home/away close, draw plausible): `1:1`.
   - Use the home/away orientation from the match (first team is home).
   Keep scores realistic (0–3 goals per side). Do not invent matches that are not in the list.
6. Place all predictions in a SINGLE `place_bets` call with `dry_run=false`, omitting `matchday` (current matchday). Each bet must use the EXACT team names from `get_bets`, formatted as `"Home vs Away=H:G"`.
7. Report a concise summary: which matches you bet on, the scoreline, and the odds you based it on. If `place_bets` reports an error, report it clearly.

Important:
- Use the exact team names returned by `get_bets` — do not translate or abbreviate them.
- Never re-bet a match that already has a prediction.
- This places real bets; only bet matches that are still open.
