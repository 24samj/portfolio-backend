import { drizzle } from "drizzle-orm/d1";
import {
  certifications,
  educations,
  experiences,
  profile,
  skillCategories,
  works,
} from "./schema";

// Named, not `import * as schema`, so the table set is explicit (and biome's
// noNamespaceImport stays happy).
const schema = {
  certifications,
  educations,
  experiences,
  profile,
  skillCategories,
  works,
};

/**
 * Build a Drizzle client over the request's D1 binding. Workers are stateless
 * per request, so this is called per handler invocation with
 * `env.PORTFOLIO_DB` — there's no long-lived connection to pool.
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
