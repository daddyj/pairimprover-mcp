/**
 * API Client for pAIrImprover Backend
 * Thin client - forwards to backend, no business logic.
 */

const baseUrl =
  process.env.PAIRIMPROVER_API_URL ?? "https://www.pairimprover.com";
const checkEndpoint = `${baseUrl}/api/check`;
const verifyEndpoint = `${baseUrl}/api/auth/verify`;

export interface CheckResponse {
  success: boolean;
  nudges: string[];
  error?: string;
  authRequired?: boolean;
}

const TIMEOUT_MS = 8000;

export async function checkSessionQuality(
  conversationContext: string,
  token: string,
): Promise<CheckResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(checkEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationContext }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: true, nudges: [] };
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error calling ${checkEndpoint}: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  const rawBody = await response.text();
  const data = (() => {
    try {
      return JSON.parse(rawBody) as CheckResponse;
    } catch {
      throw new Error(
        `Invalid JSON from ${checkEndpoint} (${response.status}): ${rawBody.slice(0, 200)}`
      );
    }
  })();

  if (response.status === 401 || data.authRequired) {
    throw new Error(
      data.error ?? "Authentication failed. Run `pairimprover login` again.",
    );
  }

  if (response.status === 429) {
    throw new Error(
      data.error ?? "Monthly limit reached. Upgrade for unlimited.",
    );
  }

  if (!response.ok) {
    throw new Error(data.error ?? `API request failed: ${response.statusText}`);
  }

  if (!data.success || !Array.isArray(data.nudges)) {
    throw new Error(data.error ?? "Invalid check response");
  }

  return data;
}

export interface VerifyResponse {
  user: {
    id: string;
    github_username: string;
    tier: string;
    analyses_count: number;
    monthly_limit: number | null;
  };
}

export async function verifyToken(token: string): Promise<VerifyResponse> {
  let response: Response;
  try {
    response = await fetch(verifyEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error calling ${verifyEndpoint}: ${msg}`);
  }

  const rawBody = await response.text();
  const data = (() => {
    try {
      return JSON.parse(rawBody);
    } catch {
      throw new Error(
        `Invalid JSON from ${verifyEndpoint} (${response.status}): ${rawBody.slice(0, 200)}`,
      );
    }
  })();

  if (!response.ok) {
    throw new Error(
      data.error ?? `Token verification failed (${response.status})`,
    );
  }

  return data as VerifyResponse;
}
