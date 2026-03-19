import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "pairimprover",
  version: "0.1.0",
});

server.registerTool(
  "test",
  {
    description: "a simple hello world MCP server state",
    inputSchema: { name: z.string().describe("Your name") },
  },
  async ({ name }) => ({
    content: [
      {
        type: "text",
        text: `Hello ${name}! pairimprover MCP server is running!`,
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
