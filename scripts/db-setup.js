import { readFileSync } from "node:fs";
import { createDatabaseIfMissing, runPsql } from "./db-client.js";

export function setupDatabase({ dryRun = false } = {}) {
  const schema = readFileSync("data/schema.sql", "utf8");
  const createResult = createDatabaseIfMissing({ dryRun });
  if (createResult.skipped) return createResult;
  return runPsql(schema, { dryRun });
}

const isCli = process.argv[1] && process.argv[1].endsWith("db-setup.js");
if (isCli) {
  try {
    const dryRun = process.argv.includes("--dry-run");
    const result = setupDatabase({ dryRun });
    if (result.skipped) {
      console.log(result.reason);
      console.log("Configura DATABASE_URL en .env.local para aplicar el schema en PostgreSQL.");
    } else {
      console.log(dryRun ? "Schema validado en dry-run." : "Schema aplicado en PostgreSQL.");
    }
  } catch (error) {
    console.error(`No se pudo preparar la BD: ${error.message}`);
    process.exit(1);
  }
}
