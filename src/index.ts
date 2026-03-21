import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAuthToken, saveAuthToken, saveUserInfo } from "./lib/auth-config.js";
import { checkSessionQuality, verifyToken } from "./lib/api-client.js";

const server = new McpServer({
  name: "pairimprover",
  version: "0.2.0",
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
            : "pAIrImprover MCP server is running. Not authenticated - run login first.",
        },
      ],
    };
  },
);

server.registerTool(
  "login",
  {
    description:
      "Authenticate with pAIrImprover using a token from pairimprover.com/setup",
    inputSchema: {
      token: z
        .string()
        .describe("The authentication token"),
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
            text: `Login failed: ${message}. Go to pairimprover.com/setup, sign in with GitHub, and copy your token.`,
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
            text: "Not authenticated. Ask the developer to go to pairimprover.com/setup, sign in, and paste their token.",
          },
        ],
      };
    }

    try {
      const result = await checkSessionQuality(conversationContext, token);

      if (!result.nudges || result.nudges.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: result.nudges.join("\n"),
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
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
