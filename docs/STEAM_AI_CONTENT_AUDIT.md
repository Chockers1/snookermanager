# AI content audit — offline v0.1.9

This is a provenance checklist, not a legal conclusion or a completed platform questionnaire. Source-code assistance alone is not classified as shipped AI content. “Definitely shipped” describes distribution, not certainty of AI authorship. No Steam account or questionnaire was accessed.

## DEFINITELY SHIPPED USER-FACING CONTENT

| File/location | Content type | Why included | Rob confirmation needed |
| --- | --- | --- | --- |
| `public/assetts/ingame/main-menu-background-3840x2160.png`, `loading-screen-background-3840x2160.png` | Raster illustration | Explicit desktop runtime asset allowlist in `scripts/package-windows.mjs` | Original creation process and commercial rights; whether derived from the flagged source below |
| `public/assetts/ingame/in-game-logo.svg`; allowlisted files in `public/assetts/icons/` including Windows ICO | Logo and application icons | Visible game branding/window icons; packaged | Logo design and outlined-font origin; any generated components |
| `src/data/gameContent.ts`, `gameSeedData.ts`, `src/game/careerDepth/`, `src/game/seasonLife/`, `src/routes/` | UI, narrative, interviews, coach advice and event text | Compiled into game and displayed as fixed/procedural templates | Which user-facing passages, if any, were generated or substantially rewritten using AI |
| Generated roster names and game data in `src/data/` and `src/game/tourDevelopment.ts` | Fictional people and procedural content | Deterministic/procedural game systems | Whether source name lists or authored descriptions were AI-created; procedural generation is not itself proof of generative AI |

## POSSIBLY AI-GENERATED / NEEDS ROB CONFIRMATION

| File/location | Content type | Why flagged | Rob confirmation needed |
| --- | --- | --- | --- |
| `public/assetts/ChatGPT Image Sep 7, 2026, 08_15_52 PM.png` | Source artwork | Filename is a strong provenance signal, not a complete authorship record | Tool/service, date, source/reference rights, edits and which exported derivatives use it |
| `public/assetts/README.md`; `public/assetts/steam/`; `brand/`; `ingame/` | Derived artwork/logo pack | README documents source image/recomposition/upscaling; derivative relationship requires creator confirmation | Identify each affected shipped or store-uploaded file; keep the original prompt/export/provenance record privately |
| Authored text in locations above | Writing | Repository cannot recover an author’s creation process | Review content history; confirm pre-generated writing separately from code assistance |

Steam capsules/hero/logo are **store candidates**, excluded from the Windows runtime allowlist; they still need disclosure consideration when uploaded. The source ChatGPT PNG is also excluded from the desktop payload. Derived menu/loading artwork is included. Do not answer “no AI artwork” simply because the source file is omitted.

## NO EVIDENCE OF AI GENERATION

| File/location | Content type | Evidence / limitation | Rob confirmation needed |
| --- | --- | --- | --- |
| `src/` runtime and `desktop/main.cjs` | Live-generated AI | No runtime LLM service/API, generated chat or online inference feature found; packaged smoke makes no HTTP requests | Confirm no external feature/assets outside this repository are planned for launch |
| `src/`, `public/` asset search | Music, sound, voices, video | No authored audio/video asset files or playback/generative voice system found. Electron’s ffmpeg DLL is runtime infrastructure, not authored music | Confirm nothing is being added before release; trailer music is a separate future rights check |
| Player UI and asset tree | Portrait photography | Initials/text identity displays; no roster photograph collection found | Confirm any later portrait assets separately |
| `node_modules/lucide-react/LICENSE`, packaged notices | Interface icons | Traceable open-source icon package, not a claim about generated artwork | Retain attribution/license records |

## Record before submission

Rob should sign a per-asset/content declaration: source, tool/creator, pre-generated versus live-generated, reference material, rights evidence and final used files. Resolve the flagged illustration and logo first, then review visible writing. No unrelated prompts, credentials or private business records belong in the public release bundle. No legal or platform eligibility determination is made here.
