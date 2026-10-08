---
title: "What is Elden Ring Bingo Brawlers?"
aliases: ["/rules/"]
---

Bingo Brawlers is an Elden Ring lockout bingo tournament created by [Captain Domo](https://www.twitch.tv/captain_domo). This page summarises the rules as the site reads them; for the official rules, see [bingobrawlers.com](https://bingobrawlers.com/).

## The board

Each game is played on a 5×5 board of 25 goals — "defeat this boss", "collect these items", and so on. Both players see the same board and race through their own runs of the game at the same time.

- One player plays as **red**, the other as **blue**.
- Completing a goal **claims** its square in your colour. A claimed square is yours: your opponent can no longer take it, so racing for the same goal matters as much as finishing your own.
- A square claimed by mistake can be unclaimed again, which frees it for either player.

{{< example-board >}}

A game is either a **base game** board, with goals drawn from Elden Ring itself, or a **DLC** board, with goals from Shadow of the Erdtree. Every goal that has appeared so far is listed under [Squares](/squares/).

## Winning a game

There are two ways to win a game:

1. **Line.** The first player to hold all five squares of a row, a column or either diagonal wins on the spot. There are 12 possible lines: rows 1–5 (top to bottom), columns 1–5 (left to right), and the two diagonals.
2. **Majority.** If no line is completed, the player holding more squares wins. A majority win is decided as soon as the leader is ahead by more than the number of squares still unclaimed, since the trailer can no longer catch up — at the latest, once a player holds 13 of the 25.

In practice lines tend to get blocked as both colours spread over the board, and about two games in three so far have been won on majority.

## Matches

A match is a series of games between the same two players. Game 1 is always a base game board and game 2 a DLC board.

- **Round robin:** exactly two games, one base and one DLC. Each game counts on its own, so a match can end 2–0 or 1–1 (a draw).
- **Double elimination (playoffs):** best of three. If the first two games are split 1–1, a third game decides the match; it can be either a base game or a DLC board. A playoff match can't end in a draw.

## Seasons

A season's exact structure — groups, how many advance, how the bracket is seeded — can change from one season to the next, so each season page has its own **Format** section. Season 6, for example, ran two round-robin groups (one point per game won) feeding a double-elimination bracket. See [Seasons](/seasons/).

## How this site counts

Every result on the site is recomputed from the board itself: each match is replayed claim by claim from its VOD transcription, and the game's winner, the winning line and the match score follow from the rules above. A few matches were only partly transcribed, so some games show no winner and some playoff results are entered by hand.

Results are hidden by default. Turn off no-spoilers mode to see scores, standings and brackets.

## Open source

This site is open source. Its code and all the match data behind it live on [GitHub](https://github.com/adri0/scadustats-site): spotted a mistranscribed square or a wrong result? Open an issue or a pull request. The VODs are transcribed with [scadustats](https://github.com/adri0/scadustats), a separate command-line tool.
