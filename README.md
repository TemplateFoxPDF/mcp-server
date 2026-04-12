# TemplateFox MCP Server

MCP (Model Context Protocol) server for the [TemplateFox](https://templatefox.com) PDF generation API. Generate PDFs from templates directly through AI assistants like Claude, Cursor, and Windsurf.

## Installation

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "templatefox": {
      "command": "npx",
      "args": ["-y", "@templatefox/mcp-server"],
      "env": {
        "TEMPLATEFOX_API_KEY": "sk_your_api_key_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add templatefox -- npx -y @templatefox/mcp-server
```

Then set the environment variable `TEMPLATEFOX_API_KEY` in your shell.

### Cursor / Windsurf

Use the same `npx -y @templatefox/mcp-server` command in your MCP server configuration, with `TEMPLATEFOX_API_KEY` in the environment.

### Global Install (alternative)

```bash
npm install -g @templatefox/mcp-server
```

Then use `templatefox-mcp-server` as the command instead of `npx`.

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `TEMPLATEFOX_API_KEY` | Yes | Your API key (starts with `sk_`). Get one at [app.templatefox.com/dashboard/api-keys](https://app.templatefox.com/dashboard/api-keys) |
| `TEMPLATEFOX_BASE_URL` | No | Override API base URL (default: `https://api.templatefox.com`) |

## Available Tools

| Tool | Description |
|---|---|
| `generate_pdf` | Generate a PDF from a template with dynamic data (1 credit) |
| `generate_pdf_async` | Queue async PDF generation with optional webhook (1 credit) |
| `get_pdf_job_status` | Check the status of an async PDF job |
| `list_pdf_jobs` | List async PDF generation jobs |
| `list_templates` | List all available templates |
| `get_template_fields` | Get the fields/variables for a template |
| `get_account_info` | Check remaining credits and account info |
| `list_transactions` | View credit transaction history |

## Example Usage

Once configured, you can ask your AI assistant:

> "List my PDF templates and generate an invoice using the Invoice Template with customer name 'John Doe' and amount 150.00"

The assistant will:
1. Call `list_templates` to find available templates
2. Call `get_template_fields` to discover required fields
3. Call `generate_pdf` with the template ID and data
4. Return the PDF download URL

## Links

- [TemplateFox Documentation](https://templatefox.com/docs)
- [API Reference](https://api.templatefox.com/docs)
- [Get API Key](https://app.templatefox.com/dashboard/api-keys)
- [GitHub](https://github.com/TemplateFoxPDF/mcp-server)

## License

MIT
