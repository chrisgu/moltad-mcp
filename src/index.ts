import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMoltadMcpServer } from "./server.js";

const { server } = createMoltadMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
