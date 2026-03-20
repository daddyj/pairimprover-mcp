/**
 * Auth Config Manager
 * Manages user authentication token and info in ~/.pairimprover/config.json
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface UserInfo {
  id: string;
  github_username: string;
  tier: "public-beta" | "invited-beta" | "free" | "pro" | "expert";
  analyses_count: number;
  monthly_limit: number | null; // null = unlimited
}

interface ConfigData {
  token?: string;
  user?: UserInfo;
}

/**
 * Get path to config file
 * Uses env var PAIRIMPROVER_CONFIG_DIR for testing, otherwise ~/.pairimprover
 */
export function getConfigPath(): string {
  const configDir =
    process.env.PAIRIMPROVER_CONFIG_DIR ||
    path.join(os.homedir(), ".pairimprover");
  return path.join(configDir, "config.json");
}

/**
 * Read config file
 */
function readConfig(): ConfigData {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    // Invalid config, return empty
    return {};
  }
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  const config = readConfig();
  return config.token || null;
}
