# Steam artwork audit — 16 September 2026

Searched `public/`, `designs/`, `docs/` and the new `steam/` area. There are no separate root `assets/` or `marketing/` trees. Existing assets are under the deliberately spelled `public/assetts/`. Inspected 46 raster/vector candidates; raster dimensions, formats, alpha and ICO sizes were read using Pillow rather than inferred from filenames. Evidence: `artifacts/steam/asset-inventory.json`.

**All ten required non-screenshot asset types have dimensionally correct candidates.** Four store capsules and the library capsule were visually reviewed, alongside the hero, transparent logo, icons and page background. Capsules contain game artwork/title, without review scores, awards, pricing or unrelated promotional text. Hero has no text; logo has actual transparency (alpha 0–255). This is a technical/content review, **not approval of ownership, AI provenance or Valve acceptance**.

Paths below are relative to `public/assetts/`.

| Asset | Steam dimensions | Required? | Existing candidate | Actual dimensions | Format | Dimensions meet? | Content rules meet? | Ready to upload? | Action required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Header Capsule | 920 × 430 | Yes | `steam/store/steam-header-capsule-920x430.png` | 920 × 430 | PNG | Yes | Yes: title + artwork | Technical yes; rights sign-off pending | Review final small-scale quality/provenance |
| Small Capsule | 462 × 174 | Yes | `steam/store/steam-small-capsule-462x174.png` | 462 × 174 | PNG | Yes | Yes; readable primary title | Technical yes; sign-off pending | Preview at Steam's 120 × 45 and 184 × 69 sizes; subtitle becomes small |
| Main Capsule | 1232 × 706 | Yes | `steam/store/steam-main-capsule-1232x706.png` | 1232 × 706 | PNG | Yes | Yes | Technical yes; sign-off pending | Approve artwork rights and final quality |
| Vertical Capsule | 748 × 896 | Yes | `steam/store/steam-vertical-capsule-748x896.png` | 748 × 896 | PNG | Yes | Yes | Technical yes; sign-off pending | Approve cropped figure composition |
| Screenshots | Minimum 1920 × 1080; 16:9 | Yes; at least five | `screenshots/README.md` is only a plan | No approved capture set | Missing | No | Cannot assess missing images | **No** | Capture real gameplay using screenshot plan; test artifacts are not approved store screenshots |
| Page Background | 1438 × 810 | Optional | `steam/store/steam-page-background-1438x810.png` | 1438 × 810 | PNG | Yes | Yes; ambient art, no title | Technical yes; sign-off pending | Preview behind actual store content |
| Shortcut Icon | 256 × 256 or 512 × 512 | Yes | `icons/steam-shortcut-icon-256x256.png` (512 version also exists) | 256 × 256; alternative 512 × 512 | PNG | Yes | Yes: brand mark | Technical yes; sign-off pending | No mandatory conversion; Steam can generate ICO |
| App Icon | 184 × 184 | Yes | `icons/steam-app-icon-184x184.jpg` | 184 × 184 | JPEG RGB | Yes | Yes | Technical yes; sign-off pending | No format change needed |
| Library Capsule | 600 × 900 | Yes | `steam/library/steam-library-capsule-600x900.png` | 600 × 900 | PNG | Yes | Yes: title only text | Technical yes; sign-off pending | Review crop and scaled sharpness |
| Library Hero | 3840 × 1240 | Yes | `steam/library/steam-library-hero-3840x1240.png` | 3840 × 1240 | PNG | Yes | Yes: no words | Technical yes; client crop review pending | Preview Steam safe-area cropping; figure is right of centre and edges use blurred extension |
| Library Logo | 1280 wide and/or 720 tall, transparent | Yes | `steam/library/steam-library-logo-1280w-transparent.png` | 1280 × 488; alpha 0–255 | PNG RGBA | Yes | Yes: logotype only | Technical yes; sign-off pending | Check halo/contrast over hero in Steam preview |
| Library Header | 920 × 430 | Yes | `steam/library/steam-library-header-920x430.png` | 920 × 430 | PNG | Yes | Yes; same composition as store header | Technical yes; sign-off pending | Approve branding consistency |

## Quality and provenance findings

- `public/assetts/README.md` explicitly records a **1672 × 941 source** and larger resampled exports. Correct pixel dimensions do not establish native 4K detail. Main/library art is usable for review; a higher-resolution original would improve close inspection, but no asset was recreated or edited here.
- Vertical/library crops trim the figure; the wide hero uses blurred side extension. These are visual quality issues to approve, not identified forbidden marketing copy.
- `ChatGPT Image Sep 7, 2026, 08_15_52 PM.png` is present. Rob must confirm generated-art provenance, commercial rights, relevant fonts/logotypes, and Steam's pre-generated AI content disclosure. Do not assume the absence of runtime AI makes disclosure unnecessary.
- Artwork depicts a snooker scene; the game is management UI rather than that scene rendered as gameplay. Store screenshots/trailer must make the actual experience clear.
- Optional bundle header exists at 707 × 232. Social/event/YouTube graphics, master art and achievement templates also exist. They are **not** substitutes for required screenshots, and achievement template images do not mean Steam achievements are integrated.
- Windows executable icon already contains 16, 24, 32, 48, 64, 128 and 256-pixel images. The desktop build uses it without modifying artwork.

## Current official requirements checked

- [Store assets](https://partner.steamgames.com/doc/store/assets/standard?l=english): four capsules, screenshot dimensions/count and optional background.
- [Library assets](https://partner.steamgames.com/doc/store/assets/libraryassets?l=english): library sizes, transparent logo and hero composition.
- [Community/client icons](https://partner.steamgames.com/doc/store/assets/community?l=english): 256/512 PNG/ICO shortcut and 184 JPEG app icon.
- [Graphical content rules](https://partner.steamgames.com/doc/store/assets/rules?l=english): restricted capsule copy and title-free hero.

Recheck these pages at actual submission. Missing deliverable now: the real screenshot set. Trailer footage/edit and all legal/provenance sign-offs also remain, but no mandatory capsule/icon file is missing. No artwork was changed in this task.
# Second-pass visual sign-off

See [STEAM_ASSET_FINAL_REVIEW.md](STEAM_ASSET_FINAL_REVIEW.md) for the later full-size/thumbnail audit and per-file classifications. It supersedes initial visual suitability judgments, including the icon fragment now flagged for manual review. No source artwork was changed.
