# Snooker Career Manager — offline store candidate, v0.1.9

This is an assembly folder, **not an approved or uploaded release**. No AppID/DepotID is known here. No credentials, player saves or Steam SDK belong in this directory.

| Folder | Content / next step |
| --- | --- |
| `artwork/` | Manifest points to original source PNG/JPEGs with hashes and visual classifications. Rob reviews flagged crops/rights, then supplies approved uploads here if desired. No duplicate image payload included. |
| `screenshots/` | Ten ordered filenames/route manifest; awaiting manual captures from actual gameplay. |
| `trailer/` | Recording-script pointer; awaiting source clips/edit/master. |
| `store-copy/` | Offline store-copy pointer; unresolved decisions explicitly marked. |
| `build-info/` | Candidate version, hashes and QA pointers. Runtime remains in `dist/windows`, not duplicated here. |

Begin with `docs/STEAM_STORE_READY_REPORT.md` at repository root. Reports referenced here use relative paths so this workspace can move. If handing this folder to another person, include the referenced docs/artwork and the complete Windows package separately, and verify hashes. Pointers are intentionally not self-contained binaries.

Do not treat internal review sheets as store screenshots. Keep captures/trailer manual until approved. Any code, signing or binary change invalidates the old build hashes and requires appropriate revalidation. Never upload `dist` wholesale: the desktop payload is only the complete `dist/windows` folder described in the deployment guide.
