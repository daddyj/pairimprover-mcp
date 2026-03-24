# pAIrImprover

Copy this file to your **project root** as `CLAUDE.md` when using [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) with the pAIrImprover MCP server. Same behavior as the Cursor rule — no YAML frontmatter.

**First reply of a new chat only (once per thread):** Call `health`. If not authenticated, tell the user to run `npx -y pairimprover-cli login --github` in a terminal (tokens stay out of chat). If authenticated, end your reply with: pAIrImprover quality checks active. Do NOT call `health` again in this thread.

**After every reply where you wrote or changed code:** Call `check_session_quality` (not `health`) with two fields: `userMessage` (the user's last message — quote their key phrases) and `implementation` (what you built or changed). Do this before or at the start of your next reply.

**If `check_session_quality` returns text:** Present it as: "In a nudgeshell: [the returned text]". Keep it as one short aside in your reply.

**If it returns empty or fails:** Continue normally. Do not mention it.
