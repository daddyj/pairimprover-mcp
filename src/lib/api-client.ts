/**
 * API Client for pAIrImprover Backend
 * Thin client - forwards to backend, no business logic.
 */

const baseUrl =
  process.env.PAIRIMPROVER_API_URL ?? "https://www.pairimprover.com";
const checkEndpoint = `${baseUrl}/api/check`;

export interface CheckNudge {
  pillar: string;
  message: string;
  severity: "gentle" | "important";
}

export interface CheckResponse {
  success: boolean;
  nudges: CheckNudge[];
  error?: string;
  authRequired?: boolean;
}

export async function checkSessionQuality(
  conversationContext: string,
  token: string,
): Promise<CheckResponse> {
  let response: Response;
  try {
    response = await fetch(checkEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationContext }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error calling ${checkEndpoint}: ${msg}`);
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
