# Troubleshooting

## Terminals don't open, or "node-pty" fails to load

node-pty is a native module, and it has to be compiled for the version of Node built into Electron, not your system Node.

```bash
npm run postinstall      # runs electron-rebuild -f
```

If compilation fails, check that the Xcode Command Line Tools are installed (`xcode-select --install`), then delete `node_modules/` and run `npm install` again.

## The editor or terminal is blank, or the console shows 404s for `vendor/`

The vendor assets haven't been copied yet:

```bash
npm run setup
```

Run it again after any dependency upgrade.

## "TeamAICoder can't be opened because Apple cannot check it for malicious software"

That's expected for a build you made yourself. See [Building and installing](building-and-installing.md#install-into-applications): right-click → **Open**, or run `xattr -dr com.apple.quarantine /Applications/TeamAICoder.app`.

## A change to `app.js` doesn't show up in `npm run dev`

Hot reload reloads renderer files, but it doesn't re-run startup wiring such as event listeners attached in `init()`. Stop the app with `Ctrl-C` and run `npm run dev` again.

## Reset everything

Quit the app and delete its preferences:

```bash
rm ~/Library/Application\ Support/TeamAICoder/teamaicoder-preferences.json
```

## Still stuck?

[Open an issue](https://github.com/teamaicoder/teamai-desktop/issues) with your macOS version, `node -v`, and the output from the terminal you started the app in. The app logs its main-process activity there.
