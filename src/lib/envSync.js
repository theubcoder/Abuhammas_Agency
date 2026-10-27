import fs from "node:fs";
import path from "node:path";

export function syncEnvFromLocal() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    // Ignore in environments where file reading is not available
  }

  return {
    username: (process.env.ADMIN_USERNAME || "admin").trim(),
    password: (process.env.ADMIN_PASSWORD || "admin123").trim(),
    secret: (process.env.SESSION_SECRET || "raza_agency_abuhammas_secure_secret_key_2026").trim(),
  };
}
