# Framework handoff: start-list iPad app (based on Bike Check)

Paste this into a new chat to build a new iPad app for a different commissaire role, reusing the framework of **Bike Check**. The new app does **not** need any bike-check marking: no Checked box, no pre/post-race check tags, no check counts.

**New app's purpose:** _[describe the new role and what you need to record or see per rider]_

---

## What Bike Check is (the reference app)

- An iPad **home-screen web app** (PWA). It is not an App Store app.
- It imports UCI World Cup **start list PDFs** (ChronoRace layout) and shows each race as a table that looks like the printed start list.
- It pulls **live results** from UCI/ChronoRace timing.
- It's used by one official on one iPad. It must work offline at the venue.
- Source code: `Dropbox/Claude/Applications - Python/Bike Check Tracker/`
- Live address: https://justinridesabike-creator.github.io/bike-check/
- Repo: `justinridesabike-creator/bike-check` on GitHub (public; it contains no rider data).
- Sample PDFs are in `samples/`, which git ignores. They are the Lake Placid XCC + XCO lists, Oct 2–3 2026.

**For the new app:** copy the folder to a new one, create a **new repo** with a new address, and give it a new name, icon and storage key. A new address gives it separate storage on the iPad, so the two apps never share or overwrite data.

---

## Architecture (keep this)

- **One file, `index.html`**, containing all HTML, CSS and JS. No build step and no framework.
- **`vendor/pdf.min.js` + `pdf.worker.min.js`**: PDF.js 3.11.174, stored locally rather than loaded from a CDN, so the app works offline.
- **`sw.js`**: the service worker that makes the app work offline. It is network-first and falls back to the cache.
- **`manifest.json` + `icon-180.png` / `icon-512.png`**: let the app install to the home screen. The icons are generated with Python/Pillow.
- **Storage:** `localStorage`, one JSON object keyed by race id, under a versioned key (`bikecheck.races.v1`). **Give the new app its own key.**
  - Race id = `date | discipline | category | startTime`.
  - Re-importing a revised start list replaces the riders but **keeps the marks recorded against each bib**.
  - On load, older saved data is migrated in place, so updates never lose data.
- **Hosting:** GitHub Pages from the `main` branch root. Pushing to `main` publishes in about 1–2 minutes.

### Install and update (Justin's workflow)
- **Install:** open the address in **Safari**, tap Share, then Add to Home Screen. Always launch from the home-screen icon; it has its own storage, separate from Safari.
- **Update:** open the app with Wi-Fi on, then close and reopen it. The home screen shows **"<App> version N"** so Justin can confirm the update arrived.
- **Every change needs both of these, or the iPad keeps the old copy:**
  - bump `APP_VERSION` in `index.html`
  - bump `VERSION` in `sw.js`
- **Caching fix:** GitHub Pages sends `Cache-Control: max-age=600`. Without the fix below, the iPad lagged up to 10 minutes behind every update.
  - The service worker fetches with `cache: 'no-store'`.
  - On install it caches files with `new Request(f, { cache: 'reload' })`.
  - It's registered with `{ updateViaCache: 'none' }` and `reg.update()`.
  - The page reloads once on `controllerchange`.
- **Never tell Justin to delete the home-screen icon.** It wipes his data.

---

## Start list PDF parsing (reuse as-is)

ChronoRace start lists have these columns: **Start · Outfit · Nr · Name / UCI MTB Team · UCI ID · NAT · YOB · WCS · UCI**.

- **Read text by column position, not in reading order.** Two quirks in the PDF's text make reading order unusable:
  - Each name is drawn 4× on top of itself to look bold.
  - Columns run together with no spaces.

  How the parser handles it:
  - PDF.js `getTextContent()` returns each text item with its position.
  - Positions are converted to page coordinates with `pdfjsLib.Util.transform(viewport.transform, item.transform)`.
  - Exact duplicates (same text and position) are dropped.
  - The **header row's x positions** set the column boundaries. The numeric columns are right-aligned, so their boundaries sit slightly left of the header text.
- **Collapse repeated names** with `/^(.{3,}?)\1+$/`, but **only for strings that contain letters**. An earlier version mangled bibs: 11 became 1, and 666 became 6.
- **Group text into lines** by y position (within 2.5).
  - A line counts as a **rider line** if its Nr is a number and it has either a numeric Start or an 11-digit UCI ID.
  - The **team** is the next line down (less than 12 units below) when its only text is in the name column. Some riders have no team.
- **Header details:** date, e.g. `SAT 3 OCT 2026`; discipline, e.g. `CROSS-COUNTRY OLYMPIC` or `CROSS-COUNTRY SHORT TRACK`; `Start Time: 9:00`; category, e.g. `Women Under 23`.
- **Outfit codes:** WCL, NCh, WCh, CCh, N. An **"S"** left of the Start number marks a **substitute** rider and gets no special handling.
- **Tested:** all 8 Lake Placid lists import correctly, from 38 to 63 riders each.
- **Import:** Files picker, PDF only, several files at once.

---

## Live timing (ChronoRace), reuse as-is

`live.ucimtbworldseries.com` just embeds ChronoRace in an iframe. The ChronoRace JSON feeds below **allow cross-origin reads** (they echo the page's origin back), so the iPad app calls them directly with no server in between. Base URL: `https://prod.chronorace.be/api/results/`

| Feed | URL |
|---|---|
| Event menu | `uci/dh/cms/<YYYYMMDD>_mtb`. The date is the event's **first day** (Lake Placid = `20261002_mtb`). Returns `null` if the event is unknown. It links every start list, results and analysis PDF. |
| Race overview | `xco/<event>/overview/<key>`. Keys: XCC = `XCCWE` `XCCME` `XCCMU` `XCCWU` (also `XCCWJ` `XCCMJ`); XCO = `WE` `ME` `MU` `WU` `WJ` `MJ`. Returns `null` before timing starts. |
| Registration | `xco/<event>/registration/<key>`. Maps `Dossard` to `RiderId` (the **UCI ID**), name, team and country. |
| Race list | `xco/<event>/race-list` |

- **Finding a race:**
  1. Start from the race's date and step back 0–4 days until the event menu returns data.
  2. Pick the discipline folder: `XCC` if the discipline says SHORT TRACK, otherwise `XCO`.
  3. Find the category by `DisplayName` and read `Route` → `Params.key`.
  4. Save `{event, key}` on the race.
- **Overview fields:**
  - Race level: `Status` (`InProgress` or `Finished`), `CurLap`, `MaxLaps`.
  - Per rider, in `OverviewData[]`: `Pos`, `Dossard`, `Status` (OK, R80 = -80%, DNF, DNS, DSQ), `InRace`, `LapDetails[]`, `CurrentSituation.Lap`.
- **Match riders by UCI ID**, through registration's `RiderId`.
  - The feed's `Dossard` is a race prefix ×1000 plus the bib, e.g. 7098 = bib 98.
  - Fall back to `Dossard % 1000 == bib` only for riders with no UCI ID.
  - Lake Placid: 199/199 riders matched.
- **Polling:**
  - Only while a race screen is open and visible.
  - Every 20 seconds while racing, every 2 minutes after the finish or when the race isn't found.
  - Fetch with `cache: 'no-store'`.
  - Save the last results so they still show offline.
- **Sorting:** live position from the first timing point onward; final result order after the finish.
  - Order: OK and R80 by position, then DNF, then DNS, then unmatched riders.
- **Display:** a Result column showing the position plus "LAP n" while the rider is racing, or a tag for DNF, DNS, -80% or DSQ.
  - A status line: "Live timing: Lap 2 / 7 · updated 9:16 · sorted by live position". It also says when it's waiting, offline or can't find the race.
- **Never re-render the list within 2 seconds of a tap.** Live re-sorts otherwise move a row under the user's finger.

---

## General features worth keeping

- **Race screen styled like the paper start list.** Large bib numbers. UCI ID and YOB are hidden below 900px (iPad portrait); Outfit, WCS and UCI are hidden below 700px. No sideways scrolling.
- **Search** by bib (prefix), name, team, nation or UCI ID. **Filter:** All / To do / Done, adapted to the new app's marks.
- **Auto-open the current race:**
  - The current race is the one starting within the next **20 minutes**, or the latest one started within 3 hours.
  - On launch the app opens it directly.
  - Every 15 seconds it checks, and switches **once per race**. It won't switch if Justin tapped in the last 30 seconds or is typing in search.
  - When it switches, a message with a **"Back to <previous race>"** button stays up for 10 seconds.
- **Auto pre/post by clock:** the start time is read from the PDF in the iPad's local time. A 30-second timer flips the mode at the start. A manual override shows "Back to auto". The new app may not need modes; drop this if so.
- **Home screen:** races grouped by **discipline code and day** (XCC Friday, XCO Saturday) in schedule order. Names are prefixed everywhere ("XCO Women Under 23"). Each card shows its start time and progress.
- **DNS / DNF statuses** (optional in the new app). DNS greys the row and drops the rider from totals. DNF greys the row but keeps the rider in totals. They are mutually exclusive. Timing DNS/DNF is applied automatically, with these rules:
  - It never overrides a manual mark.
  - It never re-applies a mark Justin removed.
  - It removes its own mark if the timing corrects itself.
- **Safety:**
  - A confirm prompt ("Are you sure?") before undoing any recorded mark.
  - An **Undo** button after every change.
  - A second tap on the same row within 0.6s is ignored.
  - `touch-action: manipulation` stops double-tap zoom.
- **More… menu:** export a CSV through the iPad share sheet, clear all marks, remove a race.
- Light and dark mode, safe-area padding, and tap targets of at least 44px.

## Remove for the new app (bike-check specific)

- The Checked box and the `pre` / `post` mark maps.
- The PRE/POST tags and the check counts.
- The "checked" wording in the CSV.
- Rule from Bike Check, only relevant if the new app records something similar: one mark per rider; DNF riders stay in the total.

---

## How we worked (keep doing this)

- Test every change in the in-app browser **before** publishing:
  - Serve locally with `python3 -m http.server`.
  - Import the sample PDFs.
  - Script the scenarios and stub `confirm()`.
  - Fake `Date.now` for anything that depends on time.
  - Check the layout at iPad landscape (1024×768) and portrait (768×1024), with no sideways scrolling.
- Then publish:
  1. Bump both version numbers.
  2. Commit (repo-local author: `Justin Evans <justinevans@Justins-MacBook-Air-8.local>`) and push.
  3. Wait once for the new `sw.js` to be served, without long polling.
  4. Tell Justin the new version number.
- Clear test data from `localStorage` after testing.
- Justin often follows along from the iPad through **Remote Control**, so keep progress updates short.
