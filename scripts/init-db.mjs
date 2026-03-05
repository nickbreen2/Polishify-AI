#!/usr/bin/env node
/**
 * One-time setup: creates the `users` table in Neon.
 * Run: npm run db:init (loads .env.local via --env-file).
 * Requires DATABASE_URL in .env.local.
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local (simple parse, no extra deps)
try {
  const envPath = path.join(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch {
  // .env.local optional if DATABASE_URL already in env
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Set it in .env.local or the environment.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        email      TEXT NOT NULL UNIQUE,
        password   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`;
    console.log("Done. Table users is ready.");
  } catch (err) {
    console.error("DB init failed:", err.message);
    process.exit(1);
  }
}

main();
