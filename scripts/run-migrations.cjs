/**
 * Applies numbered migrations (001_*.sql …) in order via Postgres.
 * Set DATABASE_URL or SUPABASE_DB_PASSWORD (+ NEXT_PUBLIC_SUPABASE_URL) in .env.local.
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function connectionString() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const pw = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!pw || !url) return null;

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  const ref = host.split(".")[0];
  const enc = encodeURIComponent(pw);
  return `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  loadEnvLocal();

  const conn = connectionString();
  if (!conn) {
    console.error(
      "Missing database credentials. Add one of:\n" +
        "  DATABASE_URL=postgresql://postgres:PASSWORD@db.<project-ref>.supabase.co:5432/postgres\n" +
        "  (from Supabase → Settings → Database → Connection string → URI)\n" +
        "or:\n" +
        "  SUPABASE_DB_PASSWORD=… (database password, not API keys) plus NEXT_PUBLIC_SUPABASE_URL\n" +
        "\nAlternatively run: npm run db:migrate:bundle\n" +
        "then paste migrations/_bundle_all.sql in Supabase → SQL Editor.\n"
    );
    process.exit(1);
  }

  const pg = require("pg");
  const client = new pg.Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{3}_/.test(f) && f.endsWith(".sql"))
    .sort();

  await client.connect();
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      console.log("Applying", f);
      await client.query(sql);
    }
  } finally {
    await client.end();
  }

  console.log("Done:", files.length, "migration files applied.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
