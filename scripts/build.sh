#!/usr/bin/env bash
# Builds the site: regenerates the stats files scadustats derives from data/matches
# (data/players/*/stats.yaml and data/square_stats/, which aren't committed), then runs
# hugo with this script's arguments, e.g. `scripts/build.sh server` or
# `scripts/build.sh --minify`.
#
# Uses the scadustats release pinned below, via uvx. To try an unreleased checkout, set
# SCADUSTATS, e.g. SCADUSTATS="uvx --from ../scadustats scadustats" scripts/build.sh.
set -euo pipefail

SCADUSTATS_VERSION=1.2.0
read -r -a scadustats <<< "${SCADUSTATS:-uvx scadustats==${SCADUSTATS_VERSION}}"

cd "$(dirname "$0")/.."

# Start from scratch, so a square or player that's gone from the data leaves no stale file.
rm -rf data/square_stats
rm -f data/players/*/stats.yaml

# Both commands print a line per file written; only a new player's info.yaml (a file
# to commit) is worth showing.
"${scadustats[@]}" player consolidate | { grep 'new player' || true; }
"${scadustats[@]}" square stats > /dev/null

exec hugo "$@"
