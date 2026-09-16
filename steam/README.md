# Steam staging (not configured for deployment)

No AppID, DepotID or credentials are present. The templates intentionally cannot be used until Rob replaces `<STEAM_APP_ID>` and `<STEAM_WINDOWS_DEPOT_ID>` with the values assigned by Valve. Never infer DepotID as AppID + 1.

Build with `npm run build:windows` on Windows. Only `dist/windows/` is depot content. Do not upload `dist/`, the repository, marketing assets, test output or a GitHub source archive.

`app_build_TEMPLATE.vdf` defaults to **Preview 1** and an empty **SetLive**. It is for local mapping validation after real IDs exist. For a later authorised upload, copy both files to ignored `steam/generated/`, make the app file's ContentRoot `../../dist/windows`, BuildOutput `../output`, and Depot reference the copied depot filename; replace IDs/version/commit. Keep Preview 1 for the first SteamPipe dry run. Preview 0 uploads; SetLive `qa` affects testers. Never set default here.

The optional GitHub workflow generates its own mapping through the pinned Steam deploy action, explicitly overriding the assigned Windows DepotID. It targets `qa` only and is disabled until configured. No current task runs it.

See [deployment](../docs/STEAM_DEPLOYMENT.md), [manual checklist](../docs/STEAM_MANUAL_CHECKLIST.md) and [readiness audit](../docs/STEAM_READINESS_AUDIT.md).
