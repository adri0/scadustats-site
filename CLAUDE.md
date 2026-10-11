# CLAUDE.md

## Project state

A Hugo static site for a fan-made website (wiki-style) for Elden Ring Bingo Brawlers league (https://bingobrawlers.com/).
 
There is no package manifest and no test suite. `scripts/build_hugo.sh` builds the site: it regenerates
the stats files `scadustats` derives from `data/matches` (`data/players/*/stats.yaml` and
`data/square_stats/`, which are gitignored, never committed), then runs `hugo` with its arguments
(`scripts/build_hugo.sh server` serves it locally). It runs the latest `scadustats` release on PyPI
through `uvx scadustats@latest`, so it needs [uv](https://docs.astral.sh/uv/). Plain `hugo` works too once
the script has run once, but won't pick up match changes in those stats. Everything under
`public/` is build output.

The look comes from the [Land of Shadow](https://github.com/adri0/land-of-shadow) theme, imported
as a Hugo module (see "Theme" below), so the build needs [Go](https://go.dev/) to fetch it. Hugo
**Extended** (>= 0.157) is required, because the CSS is SCSS.

Pages are generated from data files, which is a mix from JSON and Markdown: each data section in `content/` has a
`_content.gotmpl` content adapter that reads `data/` and calls `.AddPage`. The only hand-written
content files are `content/_index.md`, `content/about.md`, the section `_index.md` stubs and the
news posts in `content/news/` (`<yyyy-mm-dd>-<slug>.md` with `title`, `date`, `summary` and `author`;
start one with `hugo new news/<yyyy-mm-dd>-<slug>.md`; listed
newest first, and anything that reveals a result needs the spoiler classes like any other page).
The post layout signs each post with its `author` (`name`, and an optional `url` that links it),
right-aligned after an em dash. Posts don't include a signature in their text.

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
- `stats.yaml` — generated, not committed: `scripts/build_hugo.sh` regenerates it from `data/matches`
  with `scadustats player consolidate` on every build: `slug`, `display_name` (the exact spelling seen most often across that player's matches),
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

The catalogue of bingo goals: `id`, `text`, `game_type`, and optionally `aliases` -- other
wordings of the same goal seen on other broadcasts (e.g. pre-season 6's "Kill Midra, Lord of
Frenzied Flame" for "Kill Midra"), hand-edited; match files keep the wording that was on screen.
Used to canonicalise the `square_text` strings in match files, which vary in punctuation and
contain OCR typos between VODs. Lookup is by normalized text (lowercased, non-alphanumerics
stripped), over both `text` and `aliases`, via `partials/lib/square-lookup.html`;
~13 transcribed variants have no catalogue entry and are rendered in grey as "unknown".

### `data/square_stats/{base,dlc}/<id>.yaml`

One file per catalogue goal, generated, not committed: `scripts/build_hugo.sh` regenerates them with
`scadustats square stats` on every build (cells are matched to the catalogue by exact text, so
run `square consolidate` after adding a match): `id`, `text`,
`game_type`, `num_matches`/`matches` (match ids, newest first), `num_games`, `games_marked`,
`mark_rate` (`null` if never dealt), `top_players` (5 × `{slug, marks}`), `mark_times_s` (sorted
game-clock seconds of each claim), `median_mark_time_s`, and `claims` (`{match_id, game_index,
time_s, slug}` per claim, in the same order — each dot on a square page's chart links to
`<match page>#game-<N>`). "Marked" means still claimed on the
game's final board — an undone mark doesn't count — and the time is that of the mark that stuck.

These are the one precomputed stat the site does read: `content/squares/_content.gotmpl` makes a
page per file at `/squares/<game_type>/<id-with-hyphens>/` (`lib/square-path.html`), and
`lib/square-stats.html` (the squares table, the sidebar) takes catalogued goals' counts from them
too, so both agree. They also keep base and DLC apart where a goal's text or id is shared between
them (e.g. "Complete 2 Catacombs"), which the text-keyed `lib/square-lookup.html` can't. Only
transcriptions the catalogue doesn't recognise are still counted from `data/matches`.

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
A bracket match can also have `loser_next` (where its loser dropped to, drawn dashed), `lane` (where
elbows into it turn) and `qualifies` (its winner qualified for a later season: framed, and listed in
the overview instead of a champion). `bracket: playoffs` matches are a first phase drawn in the same
diagram (pre-season 6). With no `bracket: final` match, the upper- and lower-bracket matches with no
`next` decide 1st and 2nd. Either file may also be named `<id>.yaml` (`lib/season-file.html`).
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
  from `localStorage.spoilers` by the inline script in `_partials/hooks/head-end.html` and switched by any
  `[data-spoiler-toggle]` (`assets/js/modules/spoilers.js`). Anything that reveals a result —
  scores, winners, W–L records, standings, brackets — must carry `.spoiler` (blurred) or sit in
  `.spoiler-hide` (removed, with a `.spoiler-placeholder` in its place). A blurred table or
  bracket sits in a `.spoiler-cover` that starts with `partial "spoiler-notice.html"`, the
  "No-spoilers mode on" banner with a button to turn it off. Winner colouring outside
  those is neutralised at the end of `_scadu.scss`, since colour shows through a blur.
- `lib/square-index.html`, `lib/square-stats.html` and `lib/mark-time-axis.html` scan all data and must be called through
  `partialCached` with a constant variant (`""`).

## Theme

The shared look lives in [adri0/land-of-shadow](https://github.com/adri0/land-of-shadow), imported
as the Hugo module `github.com/adri0/land-of-shadow` (`[module]` in `hugo.toml`, pinned in `go.mod`
and `go.sum`). It holds kopi's SCSS/JS (copied from [kopi](https://github.com/bect/kopi), MIT),
Hotwire Turbo, the Elden Ring palette and type (`--bg-body`, `--accent`, `--surface*`,
`--gold-soft`/`--gold-glow`, `--link`, `--font-display`/`--font-body`…), and the generic layouts:
`baseof.html`, `page.html`, `section.html`, `404.html` and the `head`, `header`, `footer`,
`breadcrumb` and `edit-link` partials. Its README lists the params it reads.

The site fills in what's specific to it:

- `hugo.toml` `[params]`: `homeTitle`, `logo` (`assets/images/logo.png`, the Scadutree Fragment),
  `wordmark` (`assets/images/bingo-brawlers.png`, also the home hero), `wordmarkAlt`,
  `subtitle`, `repo`, `disclaimer`, and `htmlAttributes` (`data-spoilers="hidden"` on `<html>`).
  The `main` and `footer` menus are the header and footer links.
- Hook partials the theme leaves empty: `_partials/hooks/head-end.html` (Umami analytics and the
  no-spoilers inline script), `hooks/header-actions.html` (the no-spoilers eye button) and
  `hooks/footer-about.html` (the footer's text). `_partials/sidebar.html` (league stat widgets)
  replaces the theme's empty one.
- `assets/css/_site.scss` replaces the theme's empty one; the theme's `main.scss` imports it last.
  It imports `partials/_scadu.scss` (boards, scoreboards, stat tiles, the `--red`/`--blue` player
  colours, no-spoilers styles…).
- `assets/js/site.js` replaces the theme's empty one; its `initSite` runs on every Turbo page load,
  after the theme's modules. It starts `assets/js/modules/spoilers.js` and `sortable-tables.js`.

Any other theme file can be overridden by putting a file at the same path in the site, but prefer
changing the theme when it's about the look. To work on both at once, point Hugo at a local
checkout:

```
HUGO_MODULE_REPLACEMENTS="github.com/adri0/land-of-shadow -> $HOME/code/land-of-shadow" scripts/build_hugo.sh server
```

After tagging a theme release, update the site with `hugo mod get github.com/adri0/land-of-shadow@vX.Y.Z`
(then `hugo mod tidy`) and commit `go.mod`/`go.sum`.

Taxonomies are disabled in `hugo.toml` (`[taxonomies]` with no entries): pages come from `data/`,
not front matter, so tags/categories pages would be empty. One thing to know: kopi's base sets
`table { display: block; overflow-x: auto }`, so data tables (`.stats-table`) set `display: table`
and scroll inside a `.table-wrap` instead.
