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

If you have an Apple Developer account and want a build that opens without warnings on any Mac, electron-builder can sign and notarise it. Nothing about your identity goes into the repository. It's all read from environment variables:

```bash
export CSC_NAME="Your Name (TEAMID)"            # a "Developer ID Application" certificate in your keychain
export APPLE_API_KEY=~/keys/AuthKey_XXXXXXXXXX.p8
export APPLE_API_KEY_ID=XXXXXXXXXX
export APPLE_API_ISSUER=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
make build
```

The API key comes from App Store Connect → Users and Access → Integrations → App Store Connect API. Keep these values in your shell profile or a password manager. **Don't commit them.**

Signing is experimental: the repo doesn't ship hardened-runtime entitlements yet, and node-pty may need them. If a signed build opens but terminals fail, please [open an issue](https://github.com/teamaicoder/teamai-desktop/issues). Fully signed builds and published releases with auto-update are on the [roadmap](roadmap.md).

## App icon

The icon is drawn in `build/icon.svg`. electron-builder takes `build/icon.icns` for the app bundle, and `npm run dev` sets `build/icon.png` as the Dock icon. After editing the SVG, regenerate both (needs `rsvg-convert`, from `brew install librsvg`):

```bash
make icon
```

## Clean up

```bash
make clean        # removes dist/
```
