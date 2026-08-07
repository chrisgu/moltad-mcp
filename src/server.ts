import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MoltadApiClient, type MoltadClientOptions } from "./client.js";
import { MOLTAD_MCP_TOOLS } from "./tools.js";

export function createMoltadMcpServer(opts: MoltadClientOptions = {}) {
  const client = new MoltadApiClient(opts);

  const server = new Server(
    {
      name: "moltad",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MOLTAD_MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      annotations: {
        title: `${t.module[0].toUpperCase()}${t.module.slice(1)}: ${t.name}`,
        readOnlyHint:
          t.name === "search_placements" ||
          t.name === "whoami" ||
          t.name === "wallet" ||
          t.name === "list_campaigns" ||
          t.name === "list_buys" ||
          t.name === "list_my_inventory",
        destructiveHint:
          t.name === "buy_placement" || t.name === "request_cashout",
        openWorldHint: true,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    const tool = MOLTAD_MCP_TOOLS.find((t) => t.name === name);

    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Unknown tool: ${name}` }),
          },
        ],
      };
    }

    if (tool.auth && !client.getApiKey() && name !== "register") {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error:
                "Missing MOLTAD_API_KEY. Set env MOLTAD_API_KEY=rk_live_... or call register first.",
              hint: "https://moltad.net/#mcp",
            }),
          },
        ],
      };
    }

    try {
      const result = await client.callTool(name, args);
      return {
        isError: !result.ok,
        content: [
          { type: "text" as const, text: JSON.stringify(result.data, null, 2) },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: message }),
          },
        ],
      };
    }
  });

  return { server, client };
}
