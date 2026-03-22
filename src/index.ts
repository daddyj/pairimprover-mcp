import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAuthToken, saveAuthToken, saveUserInfo } from "./lib/auth-config.js";
import { checkSessionQuality, verifyToken } from "./lib/api-client.js";

const server = new McpServer({
  name: "pairimprover",
  version: "0.2.2",
});

server.registerTool(
  "health",
  {
    description: "Check if pAIrImprover is running and authenticated",
    inputSchema: {},
  },
  async () => {
    const token = getAuthToken();
    return {
      content: [
        {
          type: "text",
          text: token
            ? "pAIrImprover MCP server is running. Authenticated."
            : "pAIrImprover MCP server is running. Not authenticated. In a terminal run: npx -y pairimprover-cli login --github (keeps tokens out of AI chat). Then start a new chat or ask to run health again.",
        },
      ],
    };
  },
);

server.registerTool(
  "login",
  {
    description:
      "Optional fallback: save auth token to local config. Prefer npx -y pairimprover-cli login --github in a terminal so JWTs are not pasted into chat.",
    inputSchema: {
      token: z
        .string()
        .describe("JWT from pairimprover.com/setup — avoid when possible; chat logs may retain it"),
    },
  },
  async ({ token }) => {
    try {
      const result = await verifyToken(token);

      saveAuthToken(token);
      saveUserInfo({
        id: result.user.id,
        github_username: result.user.github_username,
        tier: result.user.tier as any,
        analyses_count: result.user.analyses_count,
        monthly_limit: result.user.monthly_limit,
      });

      return {
        content: [
          {
            type: "text",
            text: `Authenticated as @${result.user.github_username}. pAIrImprover quality checks are now active.`,
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed";
      return {
        content: [
          {
            type: "text",
            text: `Login failed: ${message}. Prefer: npx -y pairimprover-cli login --github in a terminal. Fallback: pairimprover.com/setup for a token (paste via login tool only if you accept chat retention risk).`,
          },
        ],
      };
    }
  },
);

server.registerTool(
  "check_session_quality",
  {
    description:
      "Get contextual quality suggestions for the current AI coding session",
    inputSchema: {
      conversationContext: z
        .string()
        .describe("Brief summary of recent coding conversation"),
    },
  },
  async ({ conversationContext }) => {
    const token = getAuthToken();
    if (!token) {
      return {
        content: [
          {
            type: "text",
            text: "Not authenticated. Ask the developer to run in a terminal: npx -y pairimprover-cli login --github (recommended). Or pairimprover.com/setup + MCP login tool only as fallback.",
          },
        ],
      };
    }

    try {
      const result = await checkSessionQuality(conversationContext, token);

      return {
        content: [
          {
            type: "text",
            text:
              result.nudges && result.nudges.length > 0
                ? result.nudges.join("\n")
                : "",
          },
        ],
      };
    } catch {
      return {
        content: [{ type: "text", text: "" }],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
