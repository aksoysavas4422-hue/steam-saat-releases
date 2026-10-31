# Using Steam Hours

1. Download [SteamHours.exe](https://github.com/aksoysavas4422-hue/steam-saat-releases/releases/latest/download/SteamHours.exe).
2. Close any previous version and open the downloaded file. First-launch preparation runs in the background; the dashboard opens when ready.
3. Choose a language using the flags at the top right. English, Turkish, Russian and Simplified Chinese are included locally.
4. Sign in to Steam inside the app and complete Steam Guard if requested. Your password and Guard code are not saved.
5. Select your games and click **Start session**. Use **Stop** to end activity or **Disconnect** to close the Steam connection.

Squad and Counter-Strike 2 are quick picks. Search the Steam Store to add up to 50 favorites; select up to 32 games for a session. DLC and bundles are rejected. Adding a favorite does not purchase or grant a license. Custom favorite playtime is read after selecting and starting the game.

FiveM opens only the local FiveM.exe file you choose. It has no assigned Steam AppID, does not report Steam playtime, and never substitutes GTA V automatically.

**Current session** shows time active in this application. **Steam playtime** shows Steam-reported totals and changes since the start. Missing or private playtime stays unavailable; totals may update with a delay.

Windows x64 is required. First launch places the application under your local Programs folder and creates desktop and Start menu shortcuts. Windows' built-in .NET Framework is used by the entry point; no .NET SDK or Node.js installation is needed. Settings and the optional encrypted session stay under the existing `steam-saat` application data folder so upgrades preserve them. A small legacy launcher preserves older shortcuts after the product rename.

Updates are checked shortly after launch and hourly. They download in the background and install silently when you choose **Quit application**. Closing to the tray keeps the app running. An update is not installed during Windows shutdown. Restart the app after a completed update.

For automatic activity on Windows login, select your games, enable **Remember this session**, **Launch with Windows** and **Start games on Windows login**. The app cannot work while the computer sleeps or is switched off. Another active Steam game session is never forcefully disconnected.
