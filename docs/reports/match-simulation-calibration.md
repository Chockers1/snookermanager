# Match Simulation Calibration

Generated: 2026-05-14T00:52:58.842Z

- 1,000 simulations were run for each matchup and each best-of format.
- Formats: Best of 7, 9, 11, 19, 25, 33, 35.
- This report is baseline match calibration only. It uses the shared pre-match strength and frame-conversion utilities, not calendar or career-world systems.
- Detailed case rows are written to `match-simulation-calibration.csv`.

## Global Warnings

- Youth vs Top 64 | BO7: expected 25.0% outside target 10-25%
- Youth vs Top 64 | BO9: expected 25.1% outside target 10-25%
- Youth vs Top 64 | BO11: expected 25.1% outside target 10-25%
- Youth vs Top 64 | BO19: expected 25.1% outside target 3-12%
- Youth vs Top 64 | BO19: youth beats top-64 too often in long formats
- Youth vs Top 64 | BO25: expected 25.1% outside target 3-12%
- Youth vs Top 64 | BO25: youth beats top-64 too often in long formats
- Youth vs Top 64 | BO33: expected 25.1% outside target 3-12%
- Youth vs Top 64 | BO33: youth beats top-64 too often in long formats
- Youth vs Top 64 | BO35: expected 25.1% outside target 3-12%
- Youth vs Top 64 | BO35: youth beats top-64 too often in long formats
- Amateur vs Q Tour | BO19: expected vs actual drift is -4.0%
- Rookie Pro vs Top 64 | BO7: expected 43.8% outside target 25-40%
- Rookie Pro vs Top 64 | BO9: expected 43.8% outside target 25-40%
- Rookie Pro vs Top 64 | BO11: expected 43.8% outside target 25-40%
- Rookie Pro vs Top 64 | BO19: expected 43.9% outside target 25-40%
- Rookie Pro vs Top 64 | BO25: expected 43.8% outside target 25-40%
- Rookie Pro vs Top 64 | BO33: expected 43.9% outside target 25-40%
- Rookie Pro vs Top 64 | BO35: expected 43.8% outside target 25-40%
- Top 32 vs Top 16 | BO7: expected 43.6% outside target 30-42%
- Top 32 vs Top 16 | BO9: expected 43.6% outside target 30-42%
- Top 32 vs Top 16 | BO11: expected 43.5% outside target 30-42%
- Top 32 vs Top 16 | BO19: expected 43.5% outside target 30-42%
- Top 32 vs Top 16 | BO25: expected 43.5% outside target 30-42%
- Top 32 vs Top 16 | BO33: expected 43.5% outside target 30-42%
- Top 32 vs Top 16 | BO35: expected 43.6% outside target 30-42%
- Top 16 vs Top 4 | BO7: expected 45.2% outside target 30-42%
- Top 16 vs Top 4 | BO9: expected 45.2% outside target 30-42%
- Top 16 vs Top 4 | BO11: expected 45.2% outside target 30-42%
- Top 16 vs Top 4 | BO19: expected 45.2% outside target 30-42%
- Top 16 vs Top 4 | BO25: expected 45.2% outside target 30-42%
- Top 16 vs Top 4 | BO33: expected 45.2% outside target 30-42%
- Top 16 vs Top 4 | BO35: expected 45.2% outside target 30-42%
- Veteran Min Support vs World Champion | BO7: expected 29.5% outside target 10-25%
- Veteran Min Support vs World Champion | BO9: expected 29.4% outside target 10-25%
- Veteran Min Support vs World Champion | BO11: expected 29.5% outside target 10-25%
- Veteran Min Support vs World Champion | BO19: expected 29.4% outside target 3-15%
- Veteran Min Support vs World Champion | BO19: world champion loses too often to min-support veteran in long formats
- Veteran Min Support vs World Champion | BO25: expected 29.4% outside target 3-15%
- Veteran Min Support vs World Champion | BO25: world champion loses too often to min-support veteran in long formats
- Veteran Min Support vs World Champion | BO33: expected 29.4% outside target 3-15%
- Veteran Min Support vs World Champion | BO33: world champion loses too often to min-support veteran in long formats
- Veteran Min Support vs World Champion | BO35: expected 29.4% outside target 3-15%
- Veteran Min Support vs World Champion | BO35: world champion loses too often to min-support veteran in long formats

## Youth vs Youth

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 49.9% | 50.0% | 47.2% | -2.7% | 49.9% | 44.1% to 50.3% | 2.8-3.0 | 141 | 339 | 173 | 478 | 45-55% | none |
| 9 | 1000 | 49.9% | 50.0% | 50.8% | 0.9% | 50.0% | 47.7% to 53.9% | 3.8-3.7 | 63 | 274 | 176 | 505 | 45-55% | none |
| 11 | 1000 | 50.0% | 50.0% | 50.5% | 0.5% | 50.0% | 47.4% to 53.6% | 4.6-4.6 | 44 | 242 | 163 | 522 | 45-55% | none |
| 19 | 1000 | 50.0% | 50.0% | 49.4% | -0.6% | 50.0% | 46.3% to 52.5% | 8.2-8.4 | 3 | 202 | 171 | 515 | 45-55% | none |
| 25 | 1000 | 50.0% | 50.0% | 51.3% | 1.3% | 50.0% | 48.2% to 54.4% | 11.0-11.0 | 0 | 154 | 198 | 464 | 45-55% | none |
| 33 | 1000 | 50.0% | 50.0% | 51.1% | 1.1% | 50.0% | 48.0% to 54.2% | 14.7-14.7 | 0 | 123 | 162 | 503 | 45-55% | none |
| 35 | 1000 | 50.0% | 50.0% | 51.2% | 1.2% | 50.0% | 48.1% to 54.3% | 15.7-15.5 | 0 | 136 | 176 | 507 | 45-55% | none |

## Youth vs Amateur

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 43.3% | 46.9% | 42.9% | -0.4% | 49.5% | 39.8% to 46.0% | 2.7-3.1 | 113 | 305 | 429 | 571 | 30-45% | none |
| 9 | 1000 | 43.3% | 47.3% | 43.8% | 0.5% | 49.6% | 40.7% to 46.9% | 3.6-3.9 | 65 | 286 | 438 | 562 | 30-45% | none |
| 11 | 1000 | 43.2% | 47.5% | 43.7% | 0.5% | 49.6% | 40.6% to 46.8% | 4.4-4.9 | 30 | 263 | 437 | 563 | 30-45% | none |
| 19 | 1000 | 43.3% | 48.1% | 47.2% | 3.9% | 49.9% | 44.1% to 50.3% | 8.0-8.4 | 1 | 190 | 472 | 528 | 30-45% | none |
| 25 | 1000 | 43.3% | 48.3% | 41.3% | -2.0% | 49.2% | 38.2% to 44.4% | 10.6-11.5 | 0 | 183 | 413 | 587 | 30-45% | none |
| 33 | 1000 | 43.3% | 48.5% | 43.5% | 0.2% | 49.6% | 40.4% to 46.6% | 14.2-15.0 | 0 | 126 | 435 | 565 | 30-45% | none |
| 35 | 1000 | 43.3% | 48.6% | 41.7% | -1.6% | 49.3% | 38.6% to 44.8% | 15.1-16.2 | 0 | 154 | 417 | 583 | 30-45% | none |

## Youth vs Top 64

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 25.0% | 37.9% | 24.6% | -0.4% | 43.1% | 21.9% to 27.3% | 2.2-3.5 | 144 | 267 | 246 | 754 | 10-25% | expected 25.0% outside target 10-25% |
| 9 | 1000 | 25.1% | 39.2% | 26.2% | 1.1% | 44.0% | 23.5% to 28.9% | 2.9-4.4 | 94 | 222 | 262 | 738 | 10-25% | expected 25.1% outside target 10-25% |
| 11 | 1000 | 25.1% | 40.2% | 27.8% | 2.7% | 44.8% | 25.0% to 30.6% | 3.7-5.3 | 43 | 200 | 278 | 722 | 10-25% | expected 25.1% outside target 10-25% |
| 19 | 1000 | 25.1% | 42.4% | 26.0% | 0.9% | 43.9% | 23.3% to 28.7% | 6.9-9.2 | 2 | 162 | 260 | 740 | 3-12% | expected 25.1% outside target 3-12%; youth beats top-64 too often in long formats |
| 25 | 1000 | 25.1% | 43.4% | 24.9% | -0.2% | 43.2% | 22.2% to 27.6% | 9.2-12.2 | 0 | 128 | 249 | 751 | 3-12% | expected 25.1% outside target 3-12%; youth beats top-64 too often in long formats |
| 33 | 1000 | 25.1% | 44.2% | 24.6% | -0.5% | 43.1% | 21.9% to 27.3% | 12.7-16.0 | 0 | 117 | 246 | 754 | 3-12% | expected 25.1% outside target 3-12%; youth beats top-64 too often in long formats |
| 35 | 1000 | 25.1% | 44.4% | 24.6% | -0.5% | 43.1% | 21.9% to 27.3% | 13.7-17.0 | 0 | 120 | 246 | 754 | 3-12% | expected 25.1% outside target 3-12%; youth beats top-64 too often in long formats |

## Amateur vs Q Tour

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 43.1% | 46.8% | 45.8% | 2.7% | 49.8% | 42.7% to 48.9% | 2.8-3.0 | 144 | 288 | 458 | 542 | 30-45% | none |
| 9 | 1000 | 43.0% | 47.2% | 43.9% | 0.9% | 49.6% | 40.8% to 47.0% | 3.5-3.9 | 71 | 262 | 439 | 561 | 30-45% | none |
| 11 | 1000 | 43.1% | 47.4% | 42.6% | -0.5% | 49.4% | 39.5% to 45.7% | 4.4-5.0 | 32 | 251 | 426 | 574 | 30-45% | none |
| 19 | 1000 | 43.1% | 48.0% | 39.1% | -4.0% | 48.8% | 36.1% to 42.1% | 7.8-8.6 | 1 | 168 | 391 | 609 | 30-45% | expected vs actual drift is -4.0% |
| 25 | 1000 | 43.1% | 48.3% | 42.1% | -1.0% | 49.4% | 39.0% to 45.2% | 10.5-11.5 | 0 | 160 | 421 | 579 | 30-45% | none |
| 33 | 1000 | 43.0% | 48.5% | 43.4% | 0.4% | 49.6% | 40.3% to 46.5% | 14.2-15.1 | 0 | 136 | 434 | 566 | 30-45% | none |
| 35 | 1000 | 43.1% | 48.5% | 41.5% | -1.6% | 49.3% | 38.4% to 44.6% | 14.9-16.1 | 0 | 122 | 415 | 585 | 30-45% | none |

## Q Tour vs Rookie Pro

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 44.9% | 47.6% | 46.2% | 1.3% | 49.9% | 43.1% to 49.3% | 2.8-3.0 | 128 | 329 | 462 | 538 | 30-45% | none |
| 9 | 1000 | 44.9% | 47.9% | 47.5% | 2.6% | 49.9% | 44.4% to 50.6% | 3.7-3.9 | 68 | 285 | 475 | 525 | 30-45% | none |
| 11 | 1000 | 44.8% | 48.1% | 44.4% | -0.4% | 49.7% | 41.3% to 47.5% | 4.4-4.8 | 33 | 248 | 443 | 557 | 30-45% | none |
| 19 | 1000 | 44.9% | 48.5% | 45.2% | 0.3% | 49.8% | 42.1% to 48.3% | 8.1-8.5 | 1 | 201 | 452 | 548 | 30-45% | none |
| 25 | 1000 | 44.9% | 48.7% | 45.5% | 0.6% | 49.8% | 42.4% to 48.6% | 10.6-11.3 | 0 | 161 | 455 | 545 | 30-45% | none |
| 33 | 1000 | 44.9% | 48.9% | 45.1% | 0.2% | 49.8% | 42.0% to 48.2% | 14.3-14.9 | 0 | 116 | 451 | 549 | 30-45% | none |
| 35 | 1000 | 45.0% | 48.9% | 43.6% | -1.4% | 49.6% | 40.5% to 46.7% | 15.2-16.0 | 0 | 133 | 436 | 564 | 30-45% | none |

## Rookie Pro vs Top 64

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 43.8% | 47.2% | 43.5% | -0.3% | 49.6% | 40.4% to 46.6% | 2.7-3.1 | 146 | 310 | 435 | 565 | 25-40% | expected 43.8% outside target 25-40% |
| 9 | 1000 | 43.8% | 47.5% | 44.6% | 0.8% | 49.7% | 41.5% to 47.7% | 3.6-3.9 | 71 | 241 | 446 | 554 | 25-40% | expected 43.8% outside target 25-40% |
| 11 | 1000 | 43.8% | 47.7% | 44.8% | 1.0% | 49.7% | 41.7% to 47.9% | 4.5-4.8 | 24 | 233 | 448 | 552 | 25-40% | expected 43.8% outside target 25-40% |
| 19 | 1000 | 43.9% | 48.2% | 45.2% | 1.3% | 49.8% | 42.1% to 48.3% | 7.9-8.5 | 4 | 181 | 452 | 548 | 25-40% | expected 43.9% outside target 25-40% |
| 25 | 1000 | 43.8% | 48.5% | 44.5% | 0.7% | 49.7% | 41.4% to 47.6% | 10.6-11.2 | 0 | 145 | 445 | 555 | 25-40% | expected 43.8% outside target 25-40% |
| 33 | 1000 | 43.9% | 48.7% | 42.3% | -1.6% | 49.4% | 39.2% to 45.4% | 14.2-15.1 | 0 | 136 | 423 | 577 | 25-40% | expected 43.9% outside target 25-40% |
| 35 | 1000 | 43.8% | 48.7% | 43.5% | -0.3% | 49.6% | 40.4% to 46.6% | 15.1-16.0 | 0 | 117 | 435 | 565 | 25-40% | expected 43.8% outside target 25-40% |

## Top 64 vs Top 32

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 44.6% | 47.5% | 42.4% | -2.2% | 49.4% | 39.3% to 45.5% | 2.7-3.1 | 120 | 318 | 424 | 576 | 35-45% | none |
| 9 | 1000 | 44.5% | 47.8% | 44.0% | -0.5% | 49.6% | 40.9% to 47.1% | 3.6-3.9 | 52 | 273 | 440 | 560 | 35-45% | none |
| 11 | 1000 | 44.5% | 48.0% | 44.5% | -0.0% | 49.7% | 41.4% to 47.6% | 4.5-4.8 | 30 | 219 | 445 | 555 | 35-45% | none |
| 19 | 1000 | 44.5% | 48.4% | 43.6% | -0.9% | 49.6% | 40.5% to 46.7% | 7.9-8.5 | 2 | 172 | 436 | 564 | 35-45% | none |
| 25 | 1000 | 44.5% | 48.6% | 41.6% | -2.9% | 49.3% | 38.5% to 44.7% | 10.6-11.4 | 0 | 156 | 416 | 584 | 35-45% | none |
| 33 | 1000 | 44.5% | 48.8% | 42.1% | -2.4% | 49.4% | 39.0% to 45.2% | 14.2-15.1 | 0 | 119 | 421 | 579 | 35-45% | none |
| 35 | 1000 | 44.4% | 48.8% | 46.3% | 1.9% | 49.9% | 43.2% to 49.4% | 15.3-15.9 | 0 | 127 | 463 | 537 | 35-45% | none |

## Top 32 vs Top 16

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 43.6% | 47.0% | 39.7% | -3.9% | 48.9% | 36.7% to 42.7% | 2.7-3.1 | 123 | 323 | 397 | 603 | 30-42% | expected 43.6% outside target 30-42% |
| 9 | 1000 | 43.6% | 47.4% | 44.3% | 0.7% | 49.7% | 41.2% to 47.4% | 3.6-3.9 | 68 | 262 | 443 | 557 | 30-42% | expected 43.6% outside target 30-42% |
| 11 | 1000 | 43.5% | 47.6% | 43.9% | 0.4% | 49.6% | 40.8% to 47.0% | 4.4-4.9 | 31 | 237 | 439 | 561 | 30-42% | expected 43.5% outside target 30-42% |
| 19 | 1000 | 43.5% | 48.2% | 42.8% | -0.7% | 49.5% | 39.7% to 45.9% | 8.1-8.6 | 0 | 192 | 428 | 572 | 30-42% | expected 43.5% outside target 30-42% |
| 25 | 1000 | 43.5% | 48.4% | 43.5% | 0.0% | 49.6% | 40.4% to 46.6% | 10.6-11.3 | 1 | 159 | 435 | 565 | 30-42% | expected 43.5% outside target 30-42% |
| 33 | 1000 | 43.5% | 48.6% | 43.8% | 0.3% | 49.6% | 40.7% to 46.9% | 14.3-15.2 | 0 | 140 | 438 | 562 | 30-42% | expected 43.5% outside target 30-42% |
| 35 | 1000 | 43.6% | 48.6% | 45.4% | 1.8% | 49.8% | 42.3% to 48.5% | 15.3-15.8 | 0 | 133 | 454 | 546 | 30-42% | expected 43.6% outside target 30-42% |

## Top 16 vs Top 4

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 45.2% | 47.8% | 46.2% | 1.0% | 49.9% | 43.1% to 49.3% | 2.8-3.0 | 136 | 310 | 462 | 538 | 30-42% | expected 45.2% outside target 30-42% |
| 9 | 1000 | 45.2% | 48.0% | 44.2% | -1.0% | 49.7% | 41.1% to 47.3% | 3.6-3.9 | 54 | 270 | 442 | 558 | 30-42% | expected 45.2% outside target 30-42% |
| 11 | 1000 | 45.2% | 48.2% | 45.4% | 0.2% | 49.8% | 42.3% to 48.5% | 4.5-4.8 | 32 | 241 | 453 | 547 | 30-42% | expected 45.2% outside target 30-42% |
| 19 | 1000 | 45.2% | 48.6% | 48.1% | 2.9% | 50.0% | 45.0% to 51.2% | 8.2-8.4 | 1 | 216 | 481 | 519 | 30-42% | expected 45.2% outside target 30-42% |
| 25 | 1000 | 45.2% | 48.8% | 48.4% | 3.2% | 50.0% | 45.3% to 51.5% | 10.8-11.2 | 1 | 151 | 484 | 516 | 30-42% | expected 45.2% outside target 30-42% |
| 33 | 1000 | 45.2% | 49.0% | 44.2% | -1.0% | 49.7% | 41.1% to 47.3% | 14.3-15.0 | 0 | 124 | 441 | 559 | 30-42% | expected 45.2% outside target 30-42% |
| 35 | 1000 | 45.2% | 49.0% | 45.5% | 0.3% | 49.8% | 42.4% to 48.6% | 15.3-15.9 | 0 | 127 | 455 | 545 | 30-42% | expected 45.2% outside target 30-42% |

## Veteran Min Support vs World Champion

| Best Of | Cases | Expected Win % | Frame Win % | Actual Win % | Diff | Std Dev | 95% Band | Avg Scoreline | Whitewashes | Deciders | Upset Wins | Favourite Wins | Target Band | Warnings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 7 | 1000 | 29.5% | 40.3% | 29.2% | -0.3% | 45.5% | 26.4% to 32.0% | 2.3-3.4 | 140 | 318 | 292 | 708 | 10-25% | expected 29.5% outside target 10-25% |
| 9 | 1000 | 29.4% | 41.3% | 27.8% | -1.6% | 44.8% | 25.0% to 30.6% | 3.1-4.4 | 80 | 267 | 278 | 722 | 10-25% | expected 29.4% outside target 10-25% |
| 11 | 1000 | 29.5% | 42.1% | 27.4% | -2.1% | 44.6% | 24.6% to 30.2% | 3.8-5.3 | 47 | 235 | 274 | 726 | 10-25% | expected 29.5% outside target 10-25% |
| 19 | 1000 | 29.4% | 43.9% | 28.8% | -0.6% | 45.3% | 26.0% to 31.6% | 7.0-9.1 | 5 | 159 | 288 | 712 | 3-15% | expected 29.4% outside target 3-15%; world champion loses too often to min-support veteran in long formats |
| 25 | 1000 | 29.4% | 44.7% | 29.1% | -0.3% | 45.4% | 26.3% to 31.9% | 9.7-12.0 | 1 | 146 | 291 | 709 | 3-15% | expected 29.4% outside target 3-15%; world champion loses too often to min-support veteran in long formats |
| 33 | 1000 | 29.4% | 45.3% | 30.9% | 1.5% | 46.2% | 28.0% to 33.8% | 13.2-15.7 | 0 | 95 | 309 | 691 | 3-15% | expected 29.4% outside target 3-15%; world champion loses too often to min-support veteran in long formats |
| 35 | 1000 | 29.4% | 45.5% | 29.7% | 0.3% | 45.7% | 26.9% to 32.5% | 14.0-16.8 | 0 | 115 | 297 | 703 | 3-15% | expected 29.4% outside target 3-15%; world champion loses too often to min-support veteran in long formats |
