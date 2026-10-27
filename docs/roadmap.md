# Roadmap

TeamAICoder is heading towards a **workbench for running many software projects in parallel**, from first idea through build, launch, marketing and maintenance. AI coding agents do most of the building, and you steer.

This is the direction, not a promise of dates.

## Now: the desktop shell

- [x] Lifecycle sections with per-section folders and tabs
- [x] Integrated terminals, embedded browser tabs, markdown and code editors
- [ ] Signed and notarised builds, installable into `/Applications`
- [ ] A per-workspace project file (`project.json`) so a project's folders, apps and tab layout open together
- [ ] GitHub sign-in, and an Issue Tracking view built on GitHub Projects

## Next: remote agents and one API

- **Agents on Kubernetes.** Coding agents run as jobs on your own cluster instead of your laptop. Each runs on its own branch, with resource limits, sessions that survive restarts, and pull requests opened only when you approve.
- **Connect from the desktop.** A run tab streams an agent's thinking, tool calls and output live. Reply when it's waiting on you, then open its PR or stop it. A remote terminal tab gives you a persistent shell on the cluster, next to the agent's work.
- **A workbench server** with one HTTP API (OpenAPI-described, with SSE for live streams) that every client uses.
- **An MCP server**, so other agents can list projects, read specs, dispatch runs and answer each other through the same guarded path.
- **A portfolio view**: every project's phase, health, stalled work and open PRs in one place.

## Later: the mobile dashboard

- A **Flutter app** for checking in from a phone or tablet: the portfolio board, an inbox of agents waiting on you, and push notifications when one gets blocked.

## Principles

- **Embed, don't rebuild.** GitHub, CI and hosting dashboards are browser tabs. Native UI is for the glue between them.
- **Files are the source of truth.** Specs and plans are markdown in git, readable by you and your agents alike.
- **You approve what ships.** Agents commit to branches. Pushing to main and opening PRs need you.
- **Self-hosted.** Your code, your cluster, your model subscriptions.

Ideas and feedback are welcome in [issues](https://github.com/teamaicoder/teamai-desktop/issues).
