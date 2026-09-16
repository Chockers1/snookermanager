# External Windows PC acceptance — 20–30 minutes

Not yet performed. Use a different ordinary Windows PC, a standard non-administrator user, and the **complete clean `dist/windows` folder** from the tested build. Do not copy the EXE alone. Record version 0.1.9 and compare EXE/ASAR SHA-256 against `release/steam/build-info/candidate.json`. Keep original careers backed up; use a disposable test career/export.

Tester/date: ______  Windows version/build: ______  CPU/RAM/GPU: ______  Display resolution/scaling: ______  Antivirus/Smart App Control: ______  Transfer method: ______

Mark PASS or FAIL and note evidence for every line. Use N/A only where explicitly allowed. Do not disable security controls or run as administrator to turn a failure into a pass.

| Time | Procedure | PASS / FAIL and notes |
| --- | --- | --- |
| 0–3 min | Copy the whole folder to a path containing spaces, e.g. Desktop/SCM external test. Confirm no source checkout, Node/npm or dev server is present. Launch the EXE by double-click. | ____ |
| 0–3 min | Record SmartScreen/antivirus warnings verbatim and take a photo if needed; note whether Windows marks the downloaded/copied package as internet-origin. A USB copy without that mark does not validate download reputation. Stop and investigate detections; no blanket bypass advice. | ____ |
| 3–6 min | Create a new career using the normal UI. Open Dashboard, Training, Calendar and Rankings. Verify logos, background art, icons and readable text, without missing-resource errors, console windows or developer paths. | ____ |
| 6–8 min | Wait for autosave; use cog → Return to Main Menu; exit normally. Restart EXE → Continue Career. Verify the same name, date, money and plan. | ____ |
| 8–11 min | Save Manager: export the test career, import as a separate career, switch back. Check both careers remain distinguishable. Confirm saves are under `%APPDATA%\Snooker Career Manager`, not the installation folder; no admin permission prompt. | ____ |
| 11–16 min | Follow real entry/travel/preparation into a match (an existing portable test export may save time). Change tactics, run Auto Play briefly, pause and Sim Frame. Check scores/log/controls and play one match to its review if time permits. Never advance the only copy of a personal career. | ____ |
| 16–20 min | At native resolution, test Windows scaling 100%, 125%, 150%: Dashboard, Training, Match Centre, Staff and Settings; open/close one modal at each. Check no hidden action buttons or overlapping text. Scrolling when enlarged may be necessary; record any inaccessible control, not merely the presence of scrolling. Restore original scale afterwards. | ____ / ____ / ____ |
| 20–22 min | Maximise/restore and resize the window; test task switching and focus return. Fullscreen: test only if available through normal OS/game controls, otherwise mark N/A (no documented in-game toggle). On a smaller display check its native resolution too. | ____ |
| 22–24 min | Mouse, wheel, Tab/Shift+Tab, Enter and Escape; enable an optional navigation shortcut and verify it. Check typing in fields does not fire navigation. No controller support is claimed. | ____ |
| 24–25 min | Sound: current build has no authored music/voice/sound playback found; silence is expected, not a failure. Confirm no unexpected noise. If new sound is added, repeat audio/output-device testing before release. | ____ |
| 25–28 min | Optional but important: import the real 25-season export, open history, load an older season and restart. Record cold-start/import/tab times and memory. If this exceeds 30 minutes, finish as a separate long-save test rather than omit it silently. | ____ / times ____ |
| 28–30 min | Restart once more, verify the latest save. Check installation folder has no new saves/logs requiring write permissions. Record crashes, unexpected dialogs and all remaining issues. | ____ |

## Acceptance

Release blocker: cannot launch normally, lost/corrupted save, security detection not understood, missing resources, stuck progression, clipped primary controls, failed reload or required administrator access. Slow long-save navigation needs measured review against the proposed requirements; this short test does not establish a hardware minimum. Larger text and 125/150% scaling require real-device judgment.

Overall PASS / FAIL: ____  Outstanding issues and reproduction: ____  Build hashes attached: ____

This is a portable-package test. Later Steam-client installation/update/overlay/ownership behavior remains a separate manual QA test after onboarding and real IDs are available. Nothing in this procedure authenticates with Steam.
