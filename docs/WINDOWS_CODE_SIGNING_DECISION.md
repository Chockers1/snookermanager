# Windows code-signing decision — v0.1.9

**Decision pending Rob’s external-PC test. No certificate was purchased or signing configured.**

## Current evidence

The game is a Windows x64 Electron 44.4.0 application packaged with @electron/packager 20.3.0. It is a portable folder with an EXE, runtime DLLs and an ASAR, not an installer. The manifest requests ordinary-user (`asInvoker`) privileges. `Get-AuthenticodeSignature` reports **NotSigned** for `dist/windows/Snooker Career Manager.exe`.

Automated local process launch, save and restart succeeded with no security dialog interrupting that run. This does **not** establish SmartScreen behavior for a consumer download: it was a locally built package launched by automation, not a downloaded internet-marked file on a clean second PC. No independent Windows warning-free download test has been completed.

## What signing changes

Authenticode can identify the publisher and help verify file integrity. SmartScreen considers reputation; signing does not guarantee that every new build is warning-free. Smart App Control can introduce additional unsigned-code restrictions. See [Microsoft’s reputation guidance](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation). Verify the displayed publisher and certificate chain on the actual delivered package if signing is adopted.

The current build, offline SteamPipe templates and game launch contain **no technical dependency on an Authenticode certificate**. They work unsigned locally. Steam policy/acceptance was not rechecked because this task forbids Steam access; do not interpret this as a platform approval guarantee. Confirm platform requirements manually when onboarding resumes.

## Before deciding

Run [external-PC QA](STEAM_EXTERNAL_PC_TEST.md) using the intended transfer/download method. Record Windows version, internet-origin marking, SmartScreen, Smart App Control and antivirus behavior, ordinary-user launch and save permissions. Decide distribution channels, legal publisher name, certificate/key custody, recurring cost and release-signing ownership. No purchase or account action is part of this pass.

## If adopted later

Sign the final product EXE **after** Electron resource/version/icon and fuse changes. Inventory executable code including `d3dcompiler_47.dll`, `dxcompiler.dll`, `dxil.dll`, `ffmpeg.dll`, `vk_swiftshader.dll` and `vulkan-1.dll`: inspect existing vendor signatures and redistribution terms rather than blindly replacing them. Ensure required executable code is signed appropriately for the target security policy. Any future custom helper, updater or installer executable also needs assessment. ASAR, JSON, PNGs and save files are not normal Authenticode targets.

Use a controlled Windows signing step, timestamp and verify signatures; then hash and smoke-test the final signed package. Electron’s [windows-sign tooling](https://packages.electronjs.org/windows-sign/v2.0.3/index.html) supports file selection and signing workflows. Keep private keys/credentials out of the repository. Signing later changes package hashes and requires a fresh candidate manifest; do not sign after recording the supposedly final hashes.

Rob choice: unsigned private QA / investigate signing before public distribution / other ______. Evidence/date: ______.
