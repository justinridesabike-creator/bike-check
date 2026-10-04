# Standings app: notes for future editions

Written after the 2026 final round (Lake Placid, Sun 4 Oct 2026), app at v27. The underscore keeps this file
off the published GitHub Pages site.

## What the app does

Live UCI DHI World Cup standings on an iPad: series standings (Now / Projected), title scenarios, podium
chances, and a live Final tab (on-track cards with splits, "rider in view" countdown, just-finished box,
live + predicted finish order, projected series standings, tap a rider for split detail or season history).
Single file `index.html`, offline cache `sw.js`. Bump `APP_VERSION` (index.html) and `VERSION` (sw.js) on every change.

## New season / new round checklist

- `DEFAULT_STD`: standings before the round (parse the ChronoRace standings PDFs; Setup can import them too).
  Check nations: the old PDF parser read 3-letter surnames as nations (NEF, VAN). Built-in standings reload
  from code on every start, so fixes reach devices.
- `DEFAULT_CB` (countback: scoring round places + last-round points) and `DEFAULT_HIST` (per round: points,
  round place, final place/time, Q1 place) plus `ROUNDS` labels. Both aligned with `DEFAULT_STD` order.
- `DEFAULT_POINTS`: art. 4.11.020 final points (2026: ME 30 places, WE 15, MJ 20, WJ 10). Last round = final points only.
- `S.event` (e.g. `20261002_mtb`), keys per category, `EVENT_TZ` (venue time zone, used for DNS timing).
- `CATS[].field / q1n / q2n`: 2026 finals were ME Q1 top 20 + Q2 top 10, WE Q1 top 10 + Q2 top 5, MJ top 20, WJ top 10.
- The storage key `standings.v1` keeps old saved data; Setup → "Save timing" clears live snapshots.

## ChronoRace timing feed (learned the hard way)

- Session: `https://prod.chronorace.be/api/results/uci/dh/race/<event>/<key>`; returns `null` before data exists.
- Event index with every session key: `https://prod.chronorace.be/api/results/uci/dh/cms/<event>`
  (Lake Placid: ME Q1 2, Q2 91, final 3; WE Q1 5, Q2 92, final 6; MJ Q 7, final 8; WJ Q 9, final 10; timed training TT_ME etc.).
  Start-list and result PDFs are linked there too (chronorace.blob.core.windows.net/webresources/<event>/...).
- **`Riders` is keyed by an internal number ("1035" for bib 35). `Results`, `OnTrack`, `NextToStart` use that key,
  not `RaceNr`.** `RaceNr` inside Riders is the plate number. (v1-v4 matched nothing until v5.)
- Live statuses: `NA` = not started, `InRace` = on track (partial `Times`, `RaceTime` = running clock),
  `Finished`, `DNF`, `DNS`, `DSQ`. A DNS can be set before the rider's start time (Pinkerton, injury).
- `Times`: 5 timing points (4 splits + finish), each with `RaceTime`, `Position` and `TimeGap` (to fastest) at that point.
- `ExpectedStartTime`: ms since midnight, venue local time. `NextToStart`: only the next few riders.
- About 1 in 5 responses comes from a lagging server; the app ignores snapshots with fewer riders down unless 3 agree.
- Pages served to the browser: CORS is fine from GitHub Pages.

## Prediction model (v17+), with backtests

- Not started: rider's best qualifying run (Q1 or Q2), section by section, times today's learned gain per section.
- Learned gain: final/qualifying ratio of finishers today, outliers dropped (median ± 2.5 MAD, min 1%), averaged.
  From this final once 3 riders are down, before that from the earlier finals today (start value 2.5%).
- On track at split j: blend of (elapsed / usual share of run at that split), own pace vs qualifying, and the
  section model; section weight 0.5/0.5/0.5/0.25 at S1-S4.
- Backtest on all 2026 finals (typical miss): not started 2.85 s, S1 2.1, S2 1.4, S3 0.9, S4 0.4 s.
- Lake Placid live (replayed): riders to come 2.2-3.4 s with learning vs 6-10 s with a fixed 2.5%; S4 0.3-0.6 s.
- "Rider in view": last 6.8% of the predicted run (15 s of a 3:39.6 run, last jump to finish at Lake Placid). Venue specific.

## Findings worth keeping

- Normal day: final 1-3% faster than qualifying (women more than men). Lake Placid: 5-7% in every category;
  Round 7 (21 Aug) 10-14% (conditions). All categories move together on a day.
- Top of the course usually gives the most time; sections differ by category, so each final learns its own.
- Elite Q2 riders can differ from Q1 riders: Lake Placid ME Q2 riders gained 3.8%, Q1 riders 6.0%.
- "Faster riders gain more" did not hold over the season (made predictions worse); not used.
- Countback (4.11.018): most 1st, then 2nd... round standings places that scored, then last round's points.
  Reproduces every tie order in the 2026 PDFs.

## Ideas not built yet

1. Learn the gain per qualifying session (Q1 vs Q2) for elites: ME Lake Placid miss 2.0 → 1.5 s; backtest on
   earlier rounds first (their Q2 keys are probably 91/92 too).
2. Show predicted places as a range when riders are within a second or two.
3. Team standings (4.11.020 C).
