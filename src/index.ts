#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

const server = new McpServer({
  name: "templatefox",
  version: "1.8.0",
});

registerTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
