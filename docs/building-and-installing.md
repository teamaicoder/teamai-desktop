# Building and installing

TeamAICoder doesn't have downloadable releases yet, so you build the app yourself. It takes a couple of minutes.

## Build the app

```bash
npm install
make build        # npm run setup, then electron-builder --mac
```

The app is written to `dist/mac-arm64/TeamAICoder.app` on Apple Silicon (`dist/mac/` on Intel). `make open` launches it from there.

## Install into /Applications

```bash
osascript -e 'quit app "TeamAICoder"' 2>/dev/null   # if it's already running
make install      # builds, then copies the app into /Applications
open /Applications/TeamAICoder.app
```

A build you made yourself isn't signed by a registered developer, so macOS Gatekeeper may refuse to open it the first time. Either right-click the app in Finder and choose **Open**, or clear the quarantine flag:

```bash
xattr -dr com.apple.quarantine /Applications/TeamAICoder.app
```

To update, pull the latest code and run `make install` again.

## Make it the default app for Markdown

TeamAICoder registers itself as an editor for Markdown (`.md`, `.markdown`, `.mdown`, `.mkd`), so it appears under **Open With** in Finder. To make it the default, so a double-click opens Markdown files in it:

```bash
make default-markdown
```

macOS may ask you to confirm the change. You can also do it by hand: select a `.md` file in Finder, **Get Info** → **Open with** → TeamAICoder → **Change All…**.

A file opened from Finder shows in the Build section, rendered. If the app isn't running, it starts and then opens the file.

## Optional: sign and notarise with your own Apple Developer ID

If you have an Apple Developer account and want a build that opens without warnings on any Mac, electron-builder signs and notarises it. The app runs under the hardened runtime with the entitlements in `build/entitlements.mac.plist` (JIT for Electron, and library loading for node-pty's native module).

Nothing about your identity goes into the repository. electron-builder finds a **Developer ID Application** certificate in your keychain by itself. Use a G2 certificate: those issued under Apple's original Developer ID authority stop working when it expires on 1 February 2027. If you have more than one with the same name, delete the old one or point `CSC_LINK` at an exported `.p12`.

Notarisation runs when these are set:

```bash
export APPLE_API_KEY=~/keys/AuthKey_XXXXXXXXXX.p8
export APPLE_API_KEY_ID=XXXXXXXXXX
export APPLE_API_ISSUER=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The key comes from App Store Connect → Users and Access → Integrations → Team Keys (the Developer role is enough). Keep these values in your shell profile or a password manager. **Don't commit them.**

| Command | Builds |
|---|---|
| `make install` | A signed `.app` for this Mac, copied into `/Applications` |
| `npm run dist:release` | Signed, notarised `.dmg` and `.zip` for Apple silicon and Intel, in `dist/` |

To check a packaged build still works, run the UI tests against it:

```bash
TAC_EXECUTABLE="$PWD/dist/mac-arm64/TeamAICoder.app/Contents/MacOS/TeamAICoder" npm run test:ui
```

## App icon

The icon is drawn in `build/icon.svg`. electron-builder takes `build/icon.icns` for the app bundle, and `npm run dev` sets `build/icon.png` as the Dock icon. After editing the SVG, regenerate both (needs `rsvg-convert`, from `brew install librsvg`):

```bash
make icon
```

## Clean up

```bash
make clean        # removes dist/
```
