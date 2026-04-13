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
    },
    { readOnlyHint: true },
    async () => {
      const url = "/v1/templates";
      const result = await apiRequest("GET", url);
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
}
