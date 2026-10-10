# scadustats-site

A Hugo static site for a fan-made website (wiki-style) for Elden Ring Bingo Brawlers league (https://bingobrawlers.com/).

It includes match history, player records, and square stats for the Elden Ring Bingo Brawlers league.

## Building

Requires Hugo **Extended** >= 0.157 (the CSS is SCSS). There are no other dependencies:

```
hugo server
```

## Credits

The look started from the [kopi](https://github.com/bect/kopi) Hugo theme. The parts still in use
are copied into `assets/css/kopi/`, `assets/js/kopi/` and `layouts/404.html`, under kopi's MIT
license (`LICENSES/kopi.txt`). `assets/js/vendor/` holds [Hotwire Turbo](https://turbo.hotwired.dev/)
8.0.20 (MIT, © 37signals), unmodified from its npm release.

## Populating `data/`

Match data under `data/matches/` isn't hand-written (but may be hand-updated if any inconsistency is found) 
— it's transcribed from YouTube VODs by [scadustats](https://github.com/adri0/scadustats), a
separate CLI tool published on PyPI. This repo has no Python tooling of its own, so `scadustats`
must be installed separately — either `pip install scadustats` or, to run it without installing,
`uvx scadustats`. Then, from this repo's root (so its `data_dir` options default to `./data`):

```
scadustats extract <youtube-url>       # transcribe a match VOD into data/matches/
scadustats square consolidate          # rebuild data/squares/{base_game,dlc}.json
scadustats player consolidate          # rebuild data/players/<slug>/stats.yaml (and info.yaml for new players)
scadustats match validate              # sanity-check everything under data/matches/
```

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
