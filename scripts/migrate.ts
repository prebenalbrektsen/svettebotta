// Versioned SQL migration runner: a
// schema_migrations table tracks which files have already run, each migration runs in its own
// transaction, and files are applied in filename order. Run with: npm run db:migrate
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run scripts/dev-db.sh start and copy its DATABASE_URL into .env.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  const { rows: appliedRows } = await pool.query("select id from schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.id as string));
  const pending = files.filter((file) => !applied.has(file));

  if (!pending.length) {
    console.log("[migrate] nothing to do");
    await pool.end();
    return;
  }

  for (const file of pending) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (id) values ($1)", [file]);
      await client.query("commit");
      console.log(`[migrate] applied ${file}`);
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error });
    } finally {
      client.release();
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
