# pairimprover-mcp

[MCP](https://modelcontextprotocol.io) server for **pAIrImprover** — connects your IDE’s AI assistant to pAIrImprover’s backend for lightweight in-session quality checks.

**Setup (recommended):** [pairimprover.com/setup](https://www.pairimprover.com/setup) — MCP config, rule file, and terminal sign-in in one place.

## Requirements

- Node.js 18+
- A pAIrImprover account (GitHub sign-in via [`pairimprover-cli`](https://www.npmjs.com/package/pairimprover-cli))

## Run

IDEs typically run the server via `npx` (see the setup page for a copy-paste config). Local development:

```bash
npm install
npm run build
node dist/index.js
```

## Tools (high level)

| Tool | Purpose |
|------|---------|
| `health` | Local check: MCP running and auth config present |
| `login` | Optional fallback to store a token (prefer terminal login — see setup page) |
| `check_session_quality` | Sends a short session summary to the backend; returns suggestion text or nothing |

Behavior and wording of checks live on the server; this package is a thin client.

## Repo layout

- `rules/` — Cursor rule template (`pairimprover.mdc`)
- `skills/` — SKILL variant for other MCP-capable tools
- `dist/` — compiled server (published)

## License

ISC

## Maintainer publish

```bash
npm run build
npm publish --access public
```
