# World endurance audit

Run a separate 50-season managed career without opening or modifying browser saves:

    npx tsx scripts/simulateFiveSeasons.ts --seasons=50 --rookie-pro-21 --seed=20260906 --skip-player-snapshots --skip-shared-audits --world-audit

The optional world-audit flag writes an actual-data JSON file at every rollover and prints progress. Files include completed brackets, frozen closing world rankings, all other circuit tables before the final calendar advance, post-rollover player profiles, development modifiers, intake, retirement and card changes. The existing managed-career report is still written when the run finishes.

To build the report for this 50-season seed:

    node scripts/summarizeWorldAudit.cjs artifacts/simulations/50-season-rookie-pro-21-middle-support-simulation-seed-20260906-world
    node scripts/renderWorldAudit.cjs

Generated reports, CSVs and raw evidence are under artifacts/simulations and are not automatically committed. The HTML report works offline and has expandable season dossiers. Its manifest fingerprints all src files because this baseline includes local changes beyond the last git commit.

The check distinguishes actual bracket results from archived career counters and qualifying places from titles. Generic field fillers are reported explicitly. All checks use the configured game rules; this is not an external regulations audit or a test of every interactive UI path. Preserve a baseline archive before rerunning the same output directory after fixes.
