# Rights and third-party asset audit — v0.1.9

Repository evidence only; not legal advice, clearance or proof of exclusivity. Categories describe the next review action. All platform branding/rights acceptance remains manual. Steam was not accessed.

| Classification | Files/content | Finding | Required record/action |
| --- | --- | --- | --- |
| CLEAR INTERNAL/PROJECT ASSET | `src/data/equipmentExpansion.ts`, `src/game/sponsorMarket.ts`, UI components and generated name lists | Equipment explicitly described as fictional; sponsor names and initials are game data, not imported logo images | Record project authorship. Check accidental resemblance/name collisions; “internal” does not prove trademark clearance |
| OPEN-SOURCE / LICENSE NEEDS RECORDING | React, React DOM, React Router, Recharts, clsx, lz-string, fflate and production transitives in `package-lock.json` | Bundled JavaScript dependencies; packager collects installed license/notice files | Distribute `dist/windows/THIRD_PARTY_NOTICES.txt`; preserve exact versions and verify new dependency licenses when upgrading |
| OPEN-SOURCE / LICENSE NEEDS RECORDING | `node_modules/lucide-react/LICENSE` | ISC icon package with MIT attribution for Feather-derived portions | Keep the complete bundled license, not only an “MIT” shorthand |
| OPEN-SOURCE / LICENSE NEEDS RECORDING | Electron/Chromium, `desktop/licenses/victory-vendor-37.3.6.txt` | Electron/Chromium notices remain beside EXE. Victory notice is version-pinned and subvendor licenses collected | Keep `LICENSE`, `LICENSES.chromium.html`, third-party notices and vendor evidence intact |
| ROB MUST CONFIRM RIGHTS | `public/assetts/ChatGPT Image Sep 7, 2026, 08_15_52 PM.png` and derivative menu/loading/store/library artwork | Apparent AI-assisted origin and supplied art; repository alone cannot prove source/reference rights | Confirm creation account/tool terms, input references and commercial usage; retain provenance privately |
| ROB MUST CONFIRM RIGHTS | `public/assetts/brand/*.svg`, `ingame/in-game-logo.svg`, logo PNGs, icons | Custom marks, with text converted to paths in inspected SVGs; font/design origin not recorded | Confirm logo authorship and any font license permitting outlines/logos and commercial distribution |
| ROB MUST CONFIRM RIGHTS | `tailwind.config.js` font-family fallbacks | Inter, Segoe UI Variable, Segoe UI, Tahoma and system fonts are referenced; no font files/@font-face downloads found | No evidence of packaged commercial fonts. Verify any future bundled fonts separately; system-family reference is not font redistribution |
| POTENTIAL RISK | `src/data/tournamentRules.ts`, `tournamentPrizes.ts`, `pathwayCalendarData.ts`, `gameSeedData.ts` | Real tournament/venue names, tour names and factual schedules/prizes appear in a fictional-player game | Review commercial use of event/tour/venue naming and data source terms; avoid implying official WST/WPBSA endorsement or licensing |
| POTENTIAL RISK | `src/data/gameSeedData.ts` surface value `Strachan` | Actual commercial brand name in game data | Decide whether the factual reference is appropriate or should be fictionalised; no code change authorised in this audit |
| ROB MUST CONFIRM RIGHTS | Tournament prize/rules source comments (WST, snooker.org and other references) | Provenance URLs exist, but a citation is not a redistribution permission | Maintain source/access/license notes; check whether copied descriptions or protected database content are used |

## Specific branding/media checks

No official WST event-logo image collection, real-player photography collection, real sponsor-logo pack, licensed music or authored voices was identified in the reviewed source/runtime asset set. This is a bounded repository finding, not a guarantee that every fictional name is unique. Textual real-event references remain a review item. Marketing illustration must not suggest direct 3D gameplay or an official licence. Never add a licensed commercial soundtrack to the trailer without evidence of rights.

## Delivery boundary

`scripts/package-windows.mjs` explicitly chooses runtime assets; source art and Steam capsules are not copied into the desktop ASAR. Store-uploaded artwork needs clearance independently. Keep the generated notices with the complete Windows folder. Confirm developer/publisher identity and ownership of the project before store submission. Rob sign-off/date/evidence location: __________.
