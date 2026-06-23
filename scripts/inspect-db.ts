import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
  const tables = await sql<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;
  const ids = await sql<{ table_name: string; data_type: string; column_default: string | null }[]>`
    select table_name, data_type, column_default
    from information_schema.columns
    where table_schema = 'public' and column_name = 'id'
    order by table_name
  `;
  const [migration] = await sql<{ count: number }[]>`
    select count(*)::int as count from drizzle.__drizzle_migrations
  `;

  console.log(JSON.stringify({
    tableCount: tables.length,
    tables: tables.map((row) => row.table_name),
    idColumns: ids,
    migrationCount: migration.count
  }, null, 2));
  } finally {
    await sql.end();
  }
}

void main();
