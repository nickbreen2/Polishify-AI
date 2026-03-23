import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      clerk_user_id TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Ensure all columns exist without failing if already present
  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS api_quota_monthly INT NOT NULL DEFAULT 20,
      ADD COLUMN IF NOT EXISTS api_used_this_period INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS billing_period_ends_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS free_period_ends_at TIMESTAMPTZ;
  `;
}
