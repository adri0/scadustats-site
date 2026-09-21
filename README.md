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
— it's transcribed from YouTube VODs by [scadustats](../scadustats), a separate CLI tool published on
PyPI. This repo has no Python tooling of its own, so `scadustats` must be installed separately —
either `pip install scadustats` or, to run it without installing, `uvx scadustats`. Then, from this
repo's root (so its `data_dir` options default to `./data`):

```
scadustats extract <youtube-url>       # transcribe a match VOD into data/matches/
scadustats square consolidate          # rebuild data/squares/{base_game,dlc}.json
scadustats player consolidate          # rebuild data/players/<slug>.yaml
scadustats match validate              # sanity-check everything under data/matches/
```

See scadustats' own README for its prerequisites and full command reference.
