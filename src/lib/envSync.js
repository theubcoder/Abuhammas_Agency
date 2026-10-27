import fs from "node:fs";
import path from "node:path";

export function syncEnvFromLocal() {
  try {
    const candidates = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), "abuhammas", ".env.local"),
      "D:\\Raza-Agency\\abuhammas\\.env.local",
      "D:\\Raza-Agency\\.env.local",
    ];

    for (const envPath of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
        const content = fs.readFileSync(/*turbopackIgnore: true*/ envPath, "utf8");
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
        break;
      }
    }
  } catch (err) {
    // Ignore in environments where file reading is not available
  }

  return {
    username: (process.env.ADMIN_USERNAME || "Raza").trim(),
    password: (process.env.ADMIN_PASSWORD || "828282").trim(),
    secret: (process.env.SESSION_SECRET || "raza_agency_abuhammas_secure_secret_key_2026").trim(),
  };
}
