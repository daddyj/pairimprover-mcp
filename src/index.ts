import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAuthToken } from "./lib/auth-config.js";
import { checkSessionQuality } from "./lib/api-client.js";

const server = new McpServer({
  name: "pairimprover",
  version: "0.1.0",
});

server.registerTool(
  "health",
  {
    description: "Simple health check - confirms MCP server is running",
    inputSchema: { name: z.string().describe("Your name") },
  },
  async ({ name }) => ({
    content: [
      {
        type: "text",
        text: `Hello ${name}! pAIrImprover MCP server is running.`,
      },
    ],
  }),
);

server.registerTool(
  "check_session_quality",
  {
    description:
      "Check recent AI coding session quality against 5 Pillars. Call periodically (every 8-10 exchanges) or when developer accepts suggestions without questioning. Pass a concise summary of recent exchanges.",
    inputSchema: {
      conversationContext: z
        .string()
        .describe("Summary of the last 8-10 exchanges in the AI coding session"),
    },
  },
  async ({ conversationContext }) => {
    const token = getAuthToken();
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Not authenticated. Run `pairimprover login` and complete the auth flow first.",
          },
        ],
      };
    }

    try {
      const result = await checkSessionQuality(conversationContext, token);

      if (result.nudges.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Session quality check: No nudges. The developer is applying good practices (questioning, testing, library-first thinking).",
            },
          ],
        };
      }

      const lines = result.nudges.map(
        (n) => `- [${n.pillar}] ${n.message} (${n.severity})`
      );
      return {
        content: [
          {
            type: "text",
            text: `Session quality check:\n${lines.join("\n")}`,
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Check failed";
      return {
        content: [
          {
            type: "text",
            text: `pAIrImprover check failed: ${message}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
