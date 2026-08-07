import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMoltadMcpServer } from "./server.js";
import { MCP_MODULES } from "./tools.js";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export function extractMcpApiKey(request: Request): string {
  const auth = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (m?.[1]) return m[1].trim();
  const url = new URL(request.url);
  return (
    url.searchParams.get("api_key") ||
    url.searchParams.get("key") ||
    url.searchParams.get("apiKey") ||
    ""
  ).trim();
}

export type HandleMoltadMcpHttpOptions = {
  apiBase?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  discoveryOnBrowserGet?: boolean;
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function shouldServeDiscovery(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const accept = (request.headers.get("Accept") || "").toLowerCase();
  if (accept.includes("text/event-stream")) return false;
  return true;
}

function withMcpAccept(request: Request): Request {
  const accept = (request.headers.get("Accept") || "").toLowerCase();
  if (
    accept.includes("application/json") &&
    accept.includes("text/event-stream")
  ) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set("Accept", "application/json, text/event-stream");
  return new Request(request, { headers });
}

export function buildMcpDiscovery(siteUrl = "https://moltad.net") {
  return {
    name: "moltad",
    version: "1.0.0",
    transport: "streamable-http",
    url: `${siteUrl.replace(/\/+$/, "")}/mcp`,
    auth: {
      header: "Authorization: Bearer rk_live_...",
      query: "?api_key=rk_live_...",
      envStdio: "MOLTAD_API_KEY",
    },
    modules: MCP_MODULES,
    docs: `${siteUrl.replace(/\/+$/, "")}/#mcp`,
    docsUrl: "https://github.com/chrisgu/moltad-mcp",
    stdioPackage: "@moltad/mcp",
  };
}

export async function handleMoltadMcpHttpRequest(
  request: Request,
  opts: HandleMoltadMcpHttpOptions = {},
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const apiBase = (opts.apiBase || "https://moltad.net").replace(/\/+$/, "");

  if (opts.discoveryOnBrowserGet !== false && shouldServeDiscovery(request)) {
    const body = JSON.stringify(buildMcpDiscovery(apiBase), null, 2);
    if (request.method === "HEAD") {
      return withCors(
        new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...CORS_HEADERS,
          },
        }),
      );
    }
    return withCors(
      new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...CORS_HEADERS,
        },
      }),
    );
  }

  const apiKey = (opts.apiKey ?? extractMcpApiKey(request)).trim();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const { server } = createMoltadMcpServer({
    apiBase,
    apiKey,
    fetchImpl: opts.fetchImpl,
  });
  await server.connect(transport);

  try {
    const response = await transport.handleRequest(withMcpAccept(request));
    return withCors(response);
  } finally {
    await server.close().catch(() => undefined);
  }
}
