# scadustats-site

A Hugo static site for a fan-made website (wiki-style) for Elden Ring Bingo Brawlers league (https://bingobrawlers.com/).

It includes match history, player records, and square stats for the Elden Ring Bingo Brawlers league.

## Building

Requires Hugo **Extended** >= 0.157 (the theme's CSS is SCSS). On a fresh clone, fetch the
theme submodule first:

```
git submodule update --init
hugo server
```

## Populating `data/`

Match data under `data/matches/` isn't hand-written (but may be hand-updated if any inconsistency is found) 
— it's transcribed from YouTube VODs by [scadustats](../scadustats), a separate CLI tool/checkout 
with its own Python environment. This repo has no Python tooling of its own; 
`scripts/scadustats` wraps `uv run --project` so you don't need to juggle two checkouts by hand:

```
scripts/scadustats extract <youtube-url>       # transcribe a match VOD into data/matches/
scripts/scadustats square consolidate          # rebuild data/squares/{base_game,dlc}.json
scripts/scadustats player consolidate          # rebuild data/players/<slug>.yaml
scripts/scadustats match validate              # sanity-check everything under data/matches/
```

By default this assumes a sibling checkout at `../scadustats`; set `SCADUSTATS_DIR` to point
elsewhere (e.g. a scadustats worktree). See scadustats' own README for its prerequisites
and full command reference.
