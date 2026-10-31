# Development

Use Node.js 22 or newer on Windows x64. Run `npm ci`, `npm run check` and `npm test`. Start the source application with `npm start`. `npm run dist` builds the NSIS update package. End users should download SteamHours.exe from Releases.

GitHub Actions builds both the background update package and SteamHours.exe, which embeds that package as the first-launch payload. The C# entry point compiles with Windows' .NET Framework compiler; a .NET SDK is not required. Product and public file names are English. Existing application data, update identity and older launch paths are retained for upgrade compatibility.

The renderer uses a responsive bento grid. Translation strings live in src/ui/i18n.js, shared by the renderer and main process. English is the source language; Turkish, Russian and Simplified Chinese must have all keys and interpolation parameters. The saved language preference is validated before writing. Language changes do not require an account, a reconnect or a network request.

CI runs syntax checks and unit tests, verifies the public Steam Store search, and exercises all four language buttons in an isolated Electron window using a synthetic preload. It saves screenshots without loading credentials or signing in to a real account. A separate clean Windows job verifies the published EXE's initial preparation and second launch. These checks do not verify a real Steam account or a complete update from one installed version to the next.

For a release, update package.json and the root versions in package-lock.json, then push to main. Published versions are not overwritten. The release includes SteamHours.exe, the NSIS update payload, latest.yml, a blockmap, checksums and the dependency lock. Never publish credentials, user data or signing secrets.
