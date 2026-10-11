import { readFile, writeFile } from "node:fs/promises";
const prefix = await readFile(
  new URL("./project-reconciliation.sql", import.meta.url),
  "utf8",
);
const integration = await readFile(
  new URL("./integration.sql", import.meta.url),
  "utf8",
);
if (
  !integration.includes("begin;") ||
  !integration.trimEnd().endsWith("commit;")
)
  throw new Error("Integration must be a transaction");
const body = integration
  .slice(integration.indexOf("begin;") + 6)
  .trimEnd()
  .slice(0, -7);
const bundle = `-- GENERATED: node supabase/build-project-migration.mjs\n-- Target: jlolyhglduixwjjngcuk. Replaces only the inspected policy snapshot.\n-- Preserves existing tables, records, Auth triggers and reputation reviews.\n-- Adds platform_feedback; legacy client RPCs are retired.\n-- Review in an isolated copy before applying to the remote project.\nbegin;\n${prefix}\n${body}\nnotify pgrst, 'reload schema';\ncommit;\n`;
await writeFile(new URL("./project-migration.sql", import.meta.url), bundle);
console.log(
  "Generated supabase/project-migration.sql; no database operation executed.",
);
