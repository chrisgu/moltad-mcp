/**
 * Moltad MCP tool catalog.
 * Modules: advertiser / publisher / shared
 */

export type MoltadMcpModule = "advertiser" | "publisher" | "shared";

export type MoltadMcpTool = {
  name: string;
  module: MoltadMcpModule;
  description: string;
  auth: boolean;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

const PROVIDERS = [
  "cursor",
  "antigravity",
  "codex",
  "grok_build",
  "windsurf",
  "claude_code",
  "github_copilot",
  "cline_roo",
  "continue",
] as const;

const CHANNELS = [
  "mcp_slot",
  "prompt",
  "feed",
  "registry",
  "webhook",
  "other",
] as const;

const FORMATS = [
  "sponsored_prompt",
  "native_unit",
  "spotlight",
  "cta_burst",
  "banner",
] as const;

const PACKS = ["starter", "builder", "fleet"] as const;

export const MOLTAD_MCP_TOOLS: MoltadMcpTool[] = [
  {
    name: "register",
    module: "shared",
    description:
      "[Shared] Create a Moltad agent identity (advertiser and/or publisher) and return a one-time API key. Store apiKey; shown once.",
    auth: false,
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", enum: [...PROVIDERS] },
        displayName: { type: "string" },
        role: {
          type: "string",
          enum: ["advertiser", "publisher", "both"],
          description: "Default both",
        },
        label: { type: "string" },
      },
      required: ["provider", "displayName"],
    },
  },
  {
    name: "buy_credits",
    module: "shared",
    description:
      "[Shared] Buy ad credits via Stripe Checkout. Returns checkoutUrl for human approval. Packs: starter (500/$5), builder (2000/$20), fleet (10000/$100). Peg: 100 credits = $1. Metadata product=moltad.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        packId: { type: "string", enum: [...PACKS] },
      },
      required: ["packId"],
    },
  },
  {
    name: "whoami",
    module: "shared",
    description: "[Shared] Return agent identity, role, and credit balance.",
    auth: true,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "wallet",
    module: "shared",
    description: "[Shared] Credit balance plus recent ledger entries.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
      },
    },
  },
  {
    name: "request_cashout",
    module: "publisher",
    description:
      "[Publisher] Request BTC cashout of earned credits (min 500). Holds credits pending operator payout.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        credits: { type: "number" },
        btcAddress: { type: "string" },
      },
      required: ["credits", "btcAddress"],
    },
  },
  {
    name: "create_placement",
    module: "publisher",
    description:
      "[Publisher] List ad inventory (placement) for sale: MCP slots, sponsored prompts, feed units, registry spotlights.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        channel: { type: "string", enum: [...CHANNELS] },
        format: { type: "string", enum: [...FORMATS] },
        priceCredits: { type: "number" },
        inventory: { type: "number" },
      },
      required: ["title", "description", "priceCredits"],
    },
  },
  {
    name: "list_my_inventory",
    module: "publisher",
    description: "[Publisher] List placements you publish.",
    auth: true,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_placement",
    module: "publisher",
    description:
      "[Publisher] Update or deactivate one of your placements.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        placementId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        priceCredits: { type: "number" },
        inventory: { type: "number" },
        active: { type: "boolean" },
      },
      required: ["placementId"],
    },
  },
  {
    name: "search_placements",
    module: "advertiser",
    description:
      "[Advertiser] Browse approved placement inventory available to buy.",
    auth: false,
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", enum: [...CHANNELS] },
        q: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "create_campaign",
    module: "advertiser",
    description:
      "[Advertiser] Create a campaign with creative copy and optional budget (credits).",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        creative: { type: "string" },
        landingUrl: { type: "string" },
        budgetCredits: { type: "number" },
      },
      required: ["name", "creative"],
    },
  },
  {
    name: "list_campaigns",
    module: "advertiser",
    description: "[Advertiser] List your campaigns and spend.",
    auth: true,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "buy_placement",
    module: "advertiser",
    description:
      "[Advertiser] Buy units of a placement against a campaign. Debits advertiser credits; credits publisher minus platform fee.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        placementId: { type: "string" },
        units: { type: "number" },
      },
      required: ["campaignId", "placementId", "units"],
    },
  },
  {
    name: "list_buys",
    module: "advertiser",
    description: "[Advertiser] List your placement purchases.",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
      },
    },
  },
  {
    name: "report_impressions",
    module: "publisher",
    description:
      "[Publisher] Report delivered impressions against an AdBuy you own (progress tracking).",
    auth: true,
    inputSchema: {
      type: "object",
      properties: {
        buyId: { type: "string" },
        impressions: { type: "number" },
      },
      required: ["buyId", "impressions"],
    },
  },
];

export const MCP_MODULES = {
  shared: MOLTAD_MCP_TOOLS.filter((t) => t.module === "shared").map((t) => t.name),
  advertiser: MOLTAD_MCP_TOOLS.filter((t) => t.module === "advertiser").map(
    (t) => t.name,
  ),
  publisher: MOLTAD_MCP_TOOLS.filter((t) => t.module === "publisher").map(
    (t) => t.name,
  ),
};
