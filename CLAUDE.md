# CLAUDE.md

## Project state

A Hugo static site for a fan-made website (wiki-style) for Elden Ring Bingo Brawlers league (https://bingobrawlers.com/).
 
There is no package manifest and no test suite; `hugo` builds the site and `hugo server` 
serves it locally. Everything under `public/` is build output.

The site is themed with [kopi](https://github.com/bect/kopi), a git submodule at `themes/kopi` —
a fresh clone needs `git submodule update --init` before it will build, and Hugo **Extended**
(>= 0.157) is required, because the theme's CSS is SCSS.

Pages are generated from data files, which is a mix from JSON and Markdown: each section in `content/` has a
`_content.gotmpl` content adapter that reads `data/` and calls `.AddPage`. The only hand-written
content files are `content/_index.md`, `content/about.md`, and the section `_index.md` stubs.

## Data: `data/`

All source data lives under `data/`, which Hugo exposes as `hugo.Data`. It's populated by
[scadustats](https://github.com/adri0/scadustats), a separate CLI tool published on PyPI (no relation to this Hugo
project) that transcribes match VODs into `data/matches/` and rebuilds `data/squares/` and
`data/players/` from them. It must be installed separately (`pip install scadustats` or `uvx
scadustats`) and run from this repo's root so its `data_dir` options default to `./data` — see the
README.

### `data/matches/season-<N>/<date>-<player_red>-vs-<player_blue>.json`

One file per recorded 1v1 match series, transcribed from a YouTube VOD.

Top-level match fields:
- `match_id`, `match_date`, `season`, `match_type` (e.g. `double_elimination`, `playoffs`)
- `player_red_name`, `player_blue_name`, `commentators`
- `metadata`: `video_url`, `duration_s`, `source_path`, `extracted_at`, `published_at`
- `num_games`, `red_score`, `blue_score`, `winner` (`"red"` / `"blue"`) — these can be `null` when a
  match is incomplete or was not fully transcribed (see `2026-08-15-blanxz-vs-SeriousChallenges.json`
  for an example with only one game and no recorded scores/winner)
- `games`: an array of per-game records (a match is usually best-of-N games)

Each entry in `games` is a 5x5 board:
- `game_index`, `start_video_ts_s`, `end_video_ts_s`, `game_type` (`base` or `dlc`)
- `winner_color`, `win_type` (`line`, `majority`, or `none` if undecided/unfinished), `win_line`
  (e.g. `"row_2"`, only set when `win_type` is `line`)
- `square_texts`: a 5x5 array of arrays — the bingo goal text for each cell, indexed `[row][col]`
  with 1-based `row`/`col` used elsewhere to reference cells
- `events`: a chronological list of everything that happened in the game. Each event has
  `event_type` (`game_start`, `mark`, `game_end`), a `game_timer` (`HH:MM:SS` elapsed in-game),
  `video_ts_s` (elapsed seconds in the source video), and for `mark` events: `row`, `col`,
  `square_text` (redundant with `square_texts[row-1][col-1]`), and `color` (which player claimed
  the square). `row`/`col`/`square_text`/`color` are `null` for `game_start`/`game_end` events.

Fields are frequently `null`/missing for matches that weren't fully commentated, scored, or
transcribed — don't assume any field beyond `video_id`, `match_date`, `season`, and the player names
is always populated.

### `data/players/<slug>/`

Two files per player, both under the same directory:

- `info.yaml` — hand-curated identity, written once by `scadustats player consolidate` and never
  touched again after that: `id` (assigned once), `slug`, `twitch` (a bare handle), `avatar`,
  `bio`. Safe to hand-edit; reruns won't overwrite it.
- `stats.yaml` — wholly regenerated from `data/matches` on every `scadustats player consolidate`
  run: `slug`, `display_name` (the exact spelling seen most often across that player's matches),
  plus precomputed stats (`season_records`, `game_record`, `game_type_records`, `all_matches`,
  `top_squares_base_game`, `top_squares_dlc`).

Only `info`'s identity fields and `stats.display_name` are read by the site. **The precomputed stat
fields are ignored** — every number on the site is recomputed from `data/matches`, because the
precomputed values go stale as matches are added and some already disagree with the match files.

Matches are joined to players by name via `partials/lib/player-lookup.html`, which compares
case-insensitively against `stats.display_name` and `info.slug`. There is no `aliases` field:
`scadustats` itself folds mis-transcribed name variants into one slug before this site ever sees
the data.

### `data/squares/{base_game,dlc}.json`

The catalogue of bingo goals: `id`, `text`, `game_type`. Used to canonicalise the `square_text`
strings in match files, which vary in punctuation and contain OCR typos between VODs. Lookup is by
normalized text (lowercased, non-alphanumerics stripped) via `partials/lib/square-lookup.html`;
~13 transcribed variants have no catalogue entry and are rendered in grey as "unknown".

### `data/seasons.json`

A list of `{id, name, start_date, end_date, bracket_type, blurb}`. Most fields are empty stubs;
layouts must tolerate that. `partials/lib/season-lookup.html` synthesises an entry for any season
that appears in a match file but not here.

A season entry may also carry `rules`, a Markdown summary of its format shown on the season page.

### `data/groups/season-<N>.yaml` and `data/brackets/season-<N>.yaml`

Hand-curated tournament structure, which the match files don't carry (`scadustats` never touches
these). `groups` lists each round-robin group's players in final placing order (used only to break
ties on points) plus `qualify`, where each placing went next; an entry written as a list or as
`{players, note}` is one slot shared by several players (e.g. a replacement), summed into one row
via `lib/season-slots.html`. `brackets` places each playoff match on a col/row grid with its `next`
match and the match file it refers to (or hand-entered scores when there is no transcription).
Both are optional per season; the season page's round-robin grids, bracket diagram and final
placings (`lib/group-tables.html`, `lib/bracket-results.html`, `lib/final-placings.html`) only
appear when they exist. Results are still recomputed from `data/matches`.

## Layout conventions

Layouts use Hugo's current names: `layouts/baseof.html`, `layouts/home.html`, `layouts/page.html`,
`layouts/section.html`, per-section `layouts/<section>/{section,page}.html`, and partials in
`layouts/_partials/` (not the old `_default/`, `list.html`, `single.html`, `partials/`).

- `_partials/lib/*.html` are pure functions: they take an input and `return` a value, and render
  nothing. Everything else renders HTML.
- `lib/match-summary.html` recomputes scores and winners from `games[]` and never trusts the
  match file's own top-level `red_score`/`blue_score`/`winner`.
- Content adapters recompute independently from `hugo.Data` rather than reading pages produced by
  another adapter — execution order across sections isn't guaranteed.
- In a content adapter, `.AddPage` takes dates under a `"dates"` key (`dict "date" …`). A
  top-level `"date"` is silently ignored and leaves every page with a zero `.Date`, which breaks
  every `sort … "Date"` / `ByDate` over those pages.
- No-spoilers mode (the default) is driven by `data-spoilers="hidden|shown"` on `<html>`, set
  from `localStorage.spoilers` by the inline script in `head.html` and switched by any
  `[data-spoiler-toggle]` (`assets/js/modules/spoilers.js`). Anything that reveals a result —
  scores, winners, W–L records, standings, brackets — must carry `.spoiler` (blurred) or sit in
  `.spoiler-hide` (removed, with a `.spoiler-placeholder` in its place). A blurred table or
  bracket sits in a `.spoiler-cover` that starts with `partial "spoiler-notice.html"`, the
  "No-spoilers mode on" banner with a button to turn it off. Winner colouring outside
  those is neutralised at the end of `_scadu.scss`, since colour shows through a blur.
- `lib/square-index.html` and `lib/square-stats.html` scan all data and must be called through
  `partialCached` with a constant variant (`""`).

## Theme: `themes/kopi`

`hugo.toml` imports the theme through `[[module.imports]]` (not `theme = "kopi"`) so its mounts can
be chosen: only `layouts`, `assets`, `static` and `i18n` are mounted. The theme's own `content/`
(a demo home page plus `/search/` and `/library/`) and `data/radio.yaml` are left unmounted.

Anything the project puts at the same path wins, which is how the theme is trimmed:

- `layouts/baseof.html` — the theme's, minus the Mermaid bootstrap, with `data-theme="dark"` on
  `<html>`. The site is dark by default: the inline script in `head.html` only switches to light when
  `localStorage.theme` is `"light"` (set by the toggle), and the OS colour scheme is ignored.
- `_partials/head.html` — no PWA manifest, no service worker, no blog JSON-LD, no `@params`;
  adds the Google Fonts (Cinzel, EB Garamond) and a favicon resized from `assets/images/logo.png`.
- `_partials/header.html` — no Library (bookmarks) icon; the dark-mode toggle stays; the brand is
  the Scadutree Fragment (`assets/images/logo.png`) plus the Bingo Brawlers wordmark
  (`assets/images/bingo-brawlers.png`, background removed, also the home hero) and
  `params.subtitle`. The wordmark is white, so `.brand-wordmark` inverts it in light mode.
- `_partials/footer.html` — no cookie banner, no placeholder social links.
- `_partials/sidebar.html` — league stat widgets instead of search/radio/tags/newsletter.
- `assets/js/main.js` — imports only the navigation, theme, interactions and prefetch modules, so
  search, the radio player, bookmarks and the service worker never reach the bundle.
- `assets/js/modules/theme.js` — the toggle only; kopi's `prefers-color-scheme` listener is dropped.
- `assets/css/main.scss` — the theme's partials minus `radio` and `search`, plus our own
  `assets/css/partials/_scadu.scss` (boards, scoreboards, stat tiles, tables) last.

Re-enabling a theme feature means restoring its import/partial *and* whatever config it needs
(kopi's README documents the radio `outputFormats`, and search needs a JSON output plus a
`content/search.md`). Taxonomies are disabled in `hugo.toml` (`[taxonomies]` with no entries):
pages come from `data/`, not front matter, so tags/categories pages would be empty.

`_scadu.scss` styles everything with the theme's tokens (`--bg-body`, `--text-main`,
`--text-muted`, `--accent`, `--border`, `--radius-*`), and re-points those tokens at an Elden Ring
palette (parchment/umber in light mode, ash-black/gold in dark). On top it adds only `--red`/`--blue`
(the two players), `--surface*` and `--gold-soft`/`--gold-glow`, each with a dark-mode value so
both colour schemes stay in sync, plus the `--font-display` (Cinzel) and `--font-body` (EB Garamond)
stacks. One thing to know: kopi's base sets `table { display: block; overflow-x: auto }`, so data tables set
`display: table` and scroll inside a `.table-wrap` instead.
