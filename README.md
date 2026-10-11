# scadustats-site

A Hugo static site for a fan-made website (wiki-style) for Elden Ring Bingo Brawlers league (https://bingobrawlers.com/).

It includes match history, player records, and square stats for the Elden Ring Bingo Brawlers league.

## Building

Requires Hugo **Extended** >= 0.157 (the theme's CSS is SCSS) and [uv](https://docs.astral.sh/uv/).
On a fresh clone, fetch the theme submodule first:

```
git submodule update --init
scripts/build_hugo.sh server
```

`scripts/build_hugo.sh` generates the stats files that aren't committed (`data/players/*/stats.yaml`
and `data/square_stats/`) from `data/matches`, with the latest `scadustats` release on
PyPI, then runs `hugo` with its arguments (`scripts/build_hugo.sh` alone builds into `public/`).
Rerun it after changing match data.

## Populating `data/`

Match data under `data/matches/` isn't hand-written (but may be hand-updated if any inconsistency is found) 
— it's transcribed from YouTube VODs by [scadustats](https://github.com/adri0/scadustats), a
separate CLI tool published on PyPI. This repo has no Python tooling of its own, so `scadustats`
must be installed separately — either `pip install scadustats` or, to run it without installing,
`uvx scadustats`. Then, from this repo's root (so its `data_dir` options default to `./data`):

```
scadustats extract <youtube-url>       # transcribe a match VOD into data/matches/
scadustats square consolidate          # rebuild data/squares/{base_game,dlc}.json
scadustats player consolidate          # create info.yaml for new players
scadustats match validate              # sanity-check everything under data/matches/
```

Commit `data/matches/`, `data/squares/` and any new `data/players/<slug>/info.yaml`. The stats
files are regenerated on every build.

See [scadustats' own README](https://github.com/adri0/scadustats#readme) for its prerequisites and
full command reference.

## Player avatars

`data/players/<slug>/info.yaml`'s `twitch` handle is also the source of the player's avatar.
`scripts/fetch-avatars.py` (Python standard library only) downloads each player's Twitch profile
picture into `static/images/players/<slug>.png` and points `avatar` at it. Rerun it from the repo
root after adding a handle or when someone changes their picture:

```
python3 scripts/fetch-avatars.py
```
