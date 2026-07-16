// Central definition of everything status.rjmlaird.co.uk watches.
// Add a new subdomain by adding one entry here — the page and the
// /api/status.json endpoint both read from this list.

export type ServiceKind = "page" | "health";

export interface ServiceDefinition {
  id: string;
  name: string;
  url: string;
  kind: ServiceKind;
  /** Shown under the name on the card, e.g. "Main site". */
  role: string;
}

export type ServiceState = "operational" | "degraded" | "down";

export interface ServiceResult extends ServiceDefinition {
  state: ServiceState;
  httpStatus: number | null;
  latencyMs: number | null;
  /** 0–4 bars, derived from latency. Down services always show 0. */
  signal: 0 | 1 | 2 | 3 | 4;
  detail: string | null;
  checkedAt: string;
}

export const services: ServiceDefinition[] = [
  { id: "main", name: "rjmlaird.co.uk", role: "Main site", url: "https://rjmlaird.co.uk", kind: "page" },
  { id: "cv", name: "cv.rjmlaird.co.uk", role: "CV", url: "https://cv.rjmlaird.co.uk", kind: "page" },
  { id: "dev", name: "dev.rjmlaird.co.uk", role: "Dev", url: "https://dev.rjmlaird.co.uk", kind: "page" },

  { id: "cdn", name: "cdn.rjmlaird.co.uk", role: "CDN", url: "https://cdn.rjmlaird.co.uk", kind: "page" },
  { id: "labs", name: "labs.rjmlaird.co.uk", role: "Labs", url: "https://labs.rjmlaird.co.uk", kind: "page" },
  { id: "upload", name: "upload.rjmlaird.co.uk", role: "Upload", url: "https://upload.rjmlaird.co.uk", kind: "page" },

  { id: "mcp", name: "mcp.rjmlaird.co.uk", role: "MCP server", url: "https://mcp.rjmlaird.co.uk", kind: "page" },

  { id: "api", name: "api.rjmlaird.co.uk", role: "API", url: "https://api.rjmlaird.co.uk/health", kind: "health" },
];

const TIMEOUT_MS = 8000;

function signalFromLatency(ms: number): 0 | 1 | 2 | 3 | 4 {
  if (ms < 300) return 4;
  if (ms < 700) return 3;
  if (ms < 1500) return 2;
  return 1;
}

async function checkOne(service: ServiceDefinition): Promise<ServiceResult> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();

  try {
    const res = await fetch(service.url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: service.kind === "health" ? "application/json" : "text/html" },
    });

    const latencyMs = Math.round(performance.now() - started);

    if (service.kind === "health") {
      let detail: string | null = null;
      let healthy = res.ok;

      try {
        const body = (await res.json()) as { status?: string; timestamp?: string };
        healthy = res.ok && body.status === "ok";
        detail = body.timestamp ?? null;
      } catch {
        healthy = false;
        detail = "Response was not valid JSON";
      }

      return {
        ...service,
        state: healthy ? "operational" : res.ok ? "degraded" : "down",
        httpStatus: res.status,
        latencyMs,
        signal: healthy ? signalFromLatency(latencyMs) : 0,
        detail,
        checkedAt,
      };
    }

    return {
      ...service,
      state: res.ok ? "operational" : "down",
      httpStatus: res.status,
      latencyMs,
      signal: res.ok ? signalFromLatency(latencyMs) : 0,
      detail: null,
      checkedAt,
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ...service,
      state: "down",
      httpStatus: null,
      latencyMs: null,
      signal: 0,
      detail: isAbort ? `No response within ${TIMEOUT_MS / 1000}s` : (error as Error)?.message ?? "Request failed",
      checkedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkAllServices(): Promise<ServiceResult[]> {
  return Promise.all(services.map(checkOne));
}

export function overallState(results: ServiceResult[]): ServiceState {
  if (results.some((r) => r.state === "down")) return "down";
  if (results.some((r) => r.state === "degraded")) return "degraded";
  return "operational";
}
