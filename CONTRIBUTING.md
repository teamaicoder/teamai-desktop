# Contributing

Thanks for your interest in TeamAICoder. Issues, ideas and pull requests are all welcome.

## Development setup

Follow [Getting started](docs/getting-started.md), then use hot reload:

```bash
npm run dev
```

The architecture is described in the [README](README.md#architecture). In short: `main.js` and `main/handlers.js` run in Node, `preload.js` is the only bridge, and `renderer/` is plain HTML/CSS/JS with no framework and no bundler.

## Tests

```bash
npm test           # Jest unit tests for the main-process handlers
npm run test:ui    # Playwright tests against the real Electron app
```

New main-process logic goes in `main/handlers.js` with injected dependencies, so it can be tested without Electron. UI behaviour gets a Playwright test in `tests/ui/`.

## Pull requests

1. Branch from `main` (`fix/…`, `feat/…`, `docs/…`).
2. Keep each PR to one change, and describe what it does and how you tested it.
3. Make sure `npm test` passes.

## Keep it public-safe

This is a public repository. Before you push, check your diff for:

- secrets, API keys, tokens or `.env` files
- signing identities, Apple team IDs or certificates (signing is configured through [environment variables](docs/building-and-installing.md#optional-sign-and-notarise-with-your-own-apple-developer-id))
- local paths (`/Users/<you>/…`), internal hostnames, IP addresses or private repo names

Screenshots in docs and PRs should show a demo project, not real private work.
