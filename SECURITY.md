# Privacy and security

Steam credentials are used only for the Steam connection. Passwords and Steam Guard codes are not written to disk or logs. An optional remembered session token is encrypted for the current Windows account using Windows DPAPI through Electron safeStorage. Remove it using **Remove saved session**. This protection does not defend against malicious software running as the same Windows user.

The Steam client runs in a separate process. The renderer has no Node access, uses an isolated sandbox and cannot browse remote pages. No public control panel is created. Closing the application fully closes the Steam connection. Trades, inventory management, advertising and telemetry are not included.

Game searches contact the Steam Store directly. Update checks contact GitHub. Account credentials are not attached to these requests. Search terms and ordinary request metadata such as IP addresses are visible to the respective service. Store search endpoints do not have a stable, documented Web API contract and may need maintenance if Steam changes them.

The app and entry point do not have an Authenticode publisher certificate. Windows may display an unknown publisher notice. Do not disable Windows security features to run the app. Automatic updates rely on GitHub HTTPS and electron-updater SHA-512 integrity checks; there is no independent publisher signature verification. A compromised repository account or write access could publish a malicious update. Protect the GitHub account with two-factor authentication.

Direct dependencies are pinned: Electron 45.1.0, steam-user 5.3.0, electron-updater 6.8.12 and electron-builder 26.18.1. Transitive dependencies are recorded in package-lock.json and builds use npm ci. Third-party packages run with application permissions and have not all received a complete source audit. This is the boundary between application safeguards and dependency trust.

Playtime automation may result in account restrictions. Steam-reported playtime is not guaranteed. The app stops its activity when another Steam game session is detected; it does not forcefully terminate that session.
