import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const [{ syncAllContentKnowledge }, { DEFAULT_OWNER_ID }] = await Promise.all([
    import("../lib/admin-content-store"),
    import("../lib/tenant")
  ]);
  const count = await syncAllContentKnowledge(DEFAULT_OWNER_ID);
  console.log(`Synchronized ${count} content records into the text knowledge base.`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
