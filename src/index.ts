#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools.js";
import { runWithApiKey } from "./api-client.js";

const SERVER_NAME = "templatefox";
const SERVER_VERSION = "1.10.0";

function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
  registerTools(server);
  return server;
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

if (port) {
  // HTTP mode: Streamable HTTP transport (stateless, for Cloud Run / remote)
  const express = (await import("express")).default;
  const cors = (await import("cors")).default;

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: SERVER_VERSION });
  });

  app.post("/mcp", async (req, res) => {
    // Extract API key from Authorization header or x-api-key
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (req.headers["x-api-key"] as string | undefined);

    if (!apiKey) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "API key required. Pass it via Authorization: Bearer <key> or x-api-key header.",
        },
        id: null,
      });
      return;
    }

    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await runWithApiKey(apiKey, () => transport.handleRequest(req, res, req.body));
      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST for MCP requests." },
      id: null,
    });
  });

  app.delete("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Sessions are not supported." },
      id: null,
    });
  });

  app.listen(port, "0.0.0.0", () => {
    console.error(`TemplateFox MCP server (HTTP) listening on http://0.0.0.0:${port}/mcp`);
  });
} else {
  // stdio mode: default for npx / local usage
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
