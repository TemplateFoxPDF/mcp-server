import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiRequest } from "./api-client.js";

export function registerTools(server: McpServer): void {

  // createPdf -> generate_pdf
  server.tool(
    "generate_pdf",
    "Generate a PDF from a template with dynamic data. Returns a URL to download the generated PDF. Costs 1 credit per generation. Use list_templates to find available templates and get_template_fields to discover required data fields.",
    {
      template_id: z.string().describe("Template short ID (12 characters)"),
      data: z.record(z.string(), z.unknown()).describe("Key-value data to render in the template. Keys must match template variables."),
      export_type: z.enum(["url", "binary"]).optional().describe("Export format: `url` uploads to CDN and returns URL, `binary` returns raw PDF bytes"),
      expiration: z.number().int().min(60).max(604800).optional().describe("URL expiration in seconds. Min: 60 (1 min), Max: 604800 (7 days). Only applies to `url` export type."),
      filename: z.string().optional().describe("Custom filename for the PDF (without .pdf extension). If not provided, defaults to 'document'. Only applies to `url` export type."),
      store_s3: z.boolean().optional().describe("Upload to your configured S3 bucket instead of CDN"),
      s3_filepath: z.string().optional().describe("Custom path prefix in your S3 bucket. Uses default prefix if not provided."),
      s3_bucket: z.string().optional().describe("Override the default bucket configured in your S3 integration."),
      pdf_variant: z.enum(["pdf/a-1b", "pdf/a-2b", "pdf/a-3b"]).optional().describe("Generate a standards-compliant PDF variant. Use `pdf/a-2b` for archival compliance (most common). Use `pdf/a-3b` if you need file attachments (e.g. Factur-X, ZUGFeRD). When not set, a standard PDF is generated."),
      version: z.string().optional().describe("Optional version tag (e.g. `prod`) or version number (e.g. `3`). When omitted, uses the current draft."),
    },
    { destructiveHint: false },
    async ({ template_id, data, export_type, expiration, filename, store_s3, s3_filepath, s3_bucket, pdf_variant, version }) => {
      const url = "/v1/pdf/create";
      const result = await apiRequest("POST", url, { template_id, data, export_type, expiration, filename, store_s3, s3_filepath, s3_bucket, pdf_variant, version });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // createImage -> generate_image
  server.tool(
    "generate_image",
    "Generate an image (PNG/JPEG/WebP) from an image template. Content is driven by modifications targeting named layers (use get_template_layers to discover them). Returns a URL to the rendered image — keep export_type at its default 'url' (binary is not supported over MCP). Costs 1 credit per generation.",
    {
      template_id: z.string().describe("Template short ID (12 characters)"),
      modifications: z.array(z.object({ name: z.string().describe("Name of the layer to modify (set via the editor's Layers panel). Matched against the element's `data-layer-name`, falling back to its `id`."), text: z.string().optional().describe("Replace the element's text content. Rendered as literal text (HTML and `{{ }}` are not interpreted)."), image_url: z.string().optional().describe("Set the image source. For an `<img>` element this sets `src`; for any other element it sets a `background-image`."), color: z.string().optional().describe("CSS color applied to the element's text (`color`)."), background: z.string().optional().describe("CSS color applied to the element's background (`background-color`)."), hidden: z.boolean().optional().describe("Hide (`true`) or show (`false`) the element.") })).optional().describe("Modify template elements by their layer name (set in the editor's Layers panel). Each item targets a layer and can set its text, image, colors, or visibility. Unknown layer names are skipped and reported in the response `warnings`."),
      data: z.record(z.string(), z.unknown()).optional().describe("Optional key-value data merged into `{{ }}` template variables. For most image templates, prefer `modifications` instead."),
      format: z.enum(["png", "jpeg", "webp"]).optional().describe("Output image format: `png` (default), `jpeg` or `webp`."),
      width: z.number().int().min(100).max(4000).optional().describe("Output width in pixels (height follows the template aspect ratio). Defaults to the template's native pixel width."),
      quality: z.number().int().min(1).max(100).optional().describe("Compression quality for `jpeg`/`webp` (1-100). Ignored for `png`."),
      export_type: z.enum(["url", "binary"]).optional().describe("Export format: `url` uploads to CDN and returns URL, `binary` returns raw image bytes"),
      expiration: z.number().int().min(60).max(604800).optional().describe("URL expiration in seconds. Min: 60 (1 min), Max: 604800 (7 days). Only applies to `url` export type."),
      filename: z.string().optional().describe("Custom filename (without extension). If not provided, defaults to 'document'. Only applies to `url` export type."),
      store_s3: z.boolean().optional().describe("Upload to your configured S3 bucket instead of CDN"),
      s3_filepath: z.string().optional().describe("Custom path prefix in your S3 bucket. Uses default prefix if not provided."),
      s3_bucket: z.string().optional().describe("Override the default bucket configured in your S3 integration."),
      version: z.string().optional().describe("Optional version tag (e.g. `prod`) or version number (e.g. `3`). When omitted, uses the current draft."),
    },
    { destructiveHint: false },
    async ({ template_id, modifications, data, format, width, quality, export_type, expiration, filename, store_s3, s3_filepath, s3_bucket, version }) => {
      const url = "/v1/image/create";
      const result = await apiRequest("POST", url, { template_id, modifications, data, format, width, quality, export_type, expiration, filename, store_s3, s3_filepath, s3_bucket, version });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // createPdfAsync -> generate_pdf_async
  server.tool(
    "generate_pdf_async",
    "Queue an asynchronous PDF generation job. Returns a job_id for status polling. Use for large documents or when you need webhook notifications. Costs 1 credit. Check progress with get_pdf_job_status.",
    {
      template_id: z.string().describe("Template short ID (12 characters)"),
      data: z.record(z.string(), z.unknown()).describe("Key-value data to render in the template."),
      export_type: z.enum(["url"]).optional().describe("Export format. Currently only `url` is supported for async."),
      expiration: z.number().int().min(60).max(604800).optional().describe("URL expiration in seconds (60-604800). Default: 86400 (24 hours)."),
      filename: z.string().optional().describe("Custom filename for the PDF (without .pdf extension)."),
      store_s3: z.boolean().optional().describe("Upload to your configured S3 bucket instead of CDN."),
      s3_filepath: z.string().optional().describe("Custom path prefix in your S3 bucket."),
      s3_bucket: z.string().optional().describe("Override the default bucket configured in your S3 integration."),
      webhook_url: z.string().optional().describe("URL to receive POST notification when job completes or fails. Must be a public HTTPS URL."),
      webhook_secret: z.string().optional().describe("Secret for HMAC-SHA256 signing of webhook payloads (min 16 chars)."),
      pdf_variant: z.enum(["pdf/a-1b", "pdf/a-2b", "pdf/a-3b"]).optional().describe("Generate a standards-compliant PDF variant. Use `pdf/a-3b` for archival compliance (most common). Use `pdf/a-3b` if you need file attachments (e.g. Factur-X). When not set, a standard PDF is generated."),
      version: z.string().optional().describe("Optional version tag (e.g. `prod`) or version number (e.g. `3`). When omitted, uses the template's default version if set, otherwise the current draft."),
    },
    { destructiveHint: false },
    async ({ template_id, data, export_type, expiration, filename, store_s3, s3_filepath, s3_bucket, webhook_url, webhook_secret, pdf_variant, version }) => {
      const url = "/v1/pdf/create-async";
      const result = await apiRequest("POST", url, { template_id, data, export_type, expiration, filename, store_s3, s3_filepath, s3_bucket, webhook_url, webhook_secret, pdf_variant, version });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // getPdfJob -> get_pdf_job_status
  server.tool(
    "get_pdf_job_status",
    "Get the status of an async PDF generation job. Returns status (pending, processing, completed, failed) and the PDF URL when completed.",
    {
      job_id: z.string().describe("Async job ID (UUID returned by the create-async endpoint)"),
    },
    { readOnlyHint: true },
    async ({ job_id }) => {
      const url = `/v1/pdf/jobs/${job_id}`;
      const result = await apiRequest("GET", url);
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // listPdfJobs -> list_pdf_jobs
  server.tool(
    "list_pdf_jobs",
    "List async PDF generation jobs. Supports pagination and filtering by status.",
    {
      limit: z.number().int().optional().describe("Maximum number of results to return"),
      offset: z.number().int().optional().describe("Number of results to skip (for pagination)"),
      status: z.enum(["pending", "processing", "completed", "failed"]).optional().describe("Filter jobs by status"),
    },
    { readOnlyHint: true },
    async ({ limit, offset, status }) => {
      const url = "/v1/pdf/jobs";
      const result = await apiRequest("GET", url, undefined, { limit, offset, status });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // listTemplates -> list_templates
  server.tool(
    "list_templates",
    "List all available PDF templates. Returns template IDs and names. Use this to discover which templates are available before generating a PDF.",
    {
      kind: z.string().optional().describe("Filter by product kind: `pdf` or `image`"),
    },
    { readOnlyHint: true },
    async ({ kind }) => {
      const url = "/v1/templates";
      const result = await apiRequest("GET", url, undefined, { kind });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // getTemplateFields -> get_template_fields
  server.tool(
    "get_template_fields",
    "Get the dynamic fields for a specific template. Use this to know what data to provide when generating a PDF. Returns field names, types, and whether they are required.",
    {
      template_id: z.string().describe("Template short ID (12 characters)"),
    },
    { readOnlyHint: true },
    async ({ template_id }) => {
      const url = `/v1/templates/${template_id}/fields`;
      const result = await apiRequest("GET", url);
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // getTemplateLayers -> get_template_layers
  server.tool(
    "get_template_layers",
    "List the named layers of an image template: name, type (background/image/text/shape), current text, and which fields each layer accepts as modifications in generate_image.",
    {
      template_id: z.string().describe("Template short ID (12 characters)"),
    },
    { readOnlyHint: true },
    async ({ template_id }) => {
      const url = `/v1/templates/${template_id}/layers`;
      const result = await apiRequest("GET", url);
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // getAccount -> get_account_info
  server.tool(
    "get_account_info",
    "Get account information including remaining credits and email address.",
    {
    },
    { readOnlyHint: true },
    async () => {
      const url = "/v1/account";
      const result = await apiRequest("GET", url);
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // listTransactions -> list_transactions
  server.tool(
    "list_transactions",
    "List credit transaction history showing PDF generations, purchases, and refunds. Supports pagination.",
    {
      limit: z.number().int().min(1).max(1000).optional().describe("Number of records to return"),
      offset: z.number().int().min(0).optional().describe("Number of records to skip"),
    },
    { readOnlyHint: true },
    async ({ limit, offset }) => {
      const url = "/v1/account/transactions";
      const result = await apiRequest("GET", url, undefined, { limit, offset });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // createAgentTemplate -> author_template
  server.tool(
    "author_template",
    "Have the TemplateFox authoring agent create a new image template from a natural-language description (plus optional brand colors/fonts/asset URLs). Asynchronous: returns a job_id — poll get_agent_job_status until completed, which always returns the template_id and a preview_url of the rendered result. Costs 25 credits, refunded if the job fails.",
    {
      instructions: z.string().describe("What the template should look like and which layers it needs, in natural language."),
      name: z.string().describe("Template name"),
      preset: z.enum(["instagram-square", "instagram-story", "og-image", "twitter-card", "pinterest-pin", "square-512"]).optional().describe("Canvas preset (or pass width + height)"),
      width: z.number().int().min(16).max(8000).optional().describe("Canvas width in px"),
      height: z.number().int().min(16).max(8000).optional().describe("Canvas height in px"),
      brand: z.object({ colors: z.array(z.string()).optional().describe("Brand colors as hex strings, e.g. ['#0C3C5F', '#E27D28']"), fonts: z.array(z.string()).optional().describe("Preferred font families. Non-built-in fonts are substituted with the closest built-in and noted in the result."), asset_urls: z.array(z.string()).optional().describe("Public https:// URLs of assets (logo, photos) the agent may use.") }).optional().describe("Optional brand constraints passed to the agent."),
    },
    { destructiveHint: false },
    async ({ instructions, name, preset, width, height, brand }) => {
      const url = "/v1/agent/templates";
      const result = await apiRequest("POST", url, { instructions, name, preset, width, height, brand });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // reviseAgentTemplate -> revise_template
  server.tool(
    "revise_template",
    "Send natural-language feedback to the authoring agent to revise an existing image template (layer names stay stable). Asynchronous: returns a job_id — poll get_agent_job_status for the fresh preview_url. Costs 10 credits, refunded if the job fails.",
    {
      template_id: z.string().describe("Template short ID (12 characters)"),
      feedback: z.string().describe("Natural-language feedback on the current template."),
      brand: z.object({ colors: z.array(z.string()).optional().describe("Brand colors as hex strings, e.g. ['#0C3C5F', '#E27D28']"), fonts: z.array(z.string()).optional().describe("Preferred font families. Non-built-in fonts are substituted with the closest built-in and noted in the result."), asset_urls: z.array(z.string()).optional().describe("Public https:// URLs of assets (logo, photos) the agent may use.") }).optional().describe("Optional brand constraints passed to the agent."),
    },
    { destructiveHint: false },
    async ({ template_id, feedback, brand }) => {
      const url = `/v1/agent/templates/${template_id}/revise`;
      const result = await apiRequest("POST", url, { feedback, brand });
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );

  // getAgentJob -> get_agent_job_status
  server.tool(
    "get_agent_job_status",
    "Get the status of an authoring-agent job (author_template / revise_template). When completed, returns the template_id and a preview_url of the rendered template. Failed jobs include the error and are automatically refunded.",
    {
      job_id: z.string().describe("Job UUID"),
    },
    { readOnlyHint: true },
    async ({ job_id }) => {
      const url = `/v1/agent/jobs/${job_id}`;
      const result = await apiRequest("GET", url);
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        isError: !result.ok,
      };
    },
  );
}
