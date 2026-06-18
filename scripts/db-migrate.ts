import { migrate } from "drizzle-orm/postgres-js/migrator";
import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const { getDatabase } = await import("../db/client");
  await migrate(getDatabase(), { migrationsFolder: "db/migrations" });
  console.log("Database migrations applied.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
