const BASE_URL = process.env.TEMPLATEFOX_BASE_URL || "https://api.templatefox.com";

function getApiKey(): string {
  const key = process.env.TEMPLATEFOX_API_KEY;
  if (!key) {
    throw new Error(
      "TEMPLATEFOX_API_KEY environment variable is required. " +
      "Get your API key at https://app.templatefox.com/dashboard/api-keys"
    );
  }
  return key;
}

interface ApiResponse {
  ok: boolean;
  status: number;
  data: unknown;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  query?: Record<string, string | number | undefined>,
): Promise<ApiResponse> {
  const url = new URL(path, BASE_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    "x-api-key": getApiKey(),
    "Accept": "application/json",
  };

  const init: RequestInit = { method, headers };

  if (body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), init);

  let data: unknown;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { ok: response.ok, status: response.status, data };
}
