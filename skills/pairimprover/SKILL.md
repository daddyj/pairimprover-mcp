---
name: pairimprover
description: pAIrImprover session quality checks — health on new chat, nudges after code changes
---

## pAIrImprover

**First reply of a new chat:** Call `health`. If not authenticated, tell the user to run `npx -y pairimprover-cli login --github` in a terminal (tokens stay out of chat). If authenticated, end your reply with: pAIrImprover quality checks active.

**After every reply where you wrote or changed code:** Call `check_session_quality` with a 1-2 sentence summary: start with what the user said or asked for (quote their key phrases), then what you implemented. Do this before or at the start of your next reply.

**If `check_session_quality` returns text:** Present it as: "In a nudgeshell: [the returned text]". Keep it as one short aside in your reply.

**If it returns empty or fails:** Continue normally. Do not mention it.
