import { z } from "zod";
import type { PortfolioStats } from "@/types/stats.type";

/** Documentation only (see `PortfolioStats`). */
export const statsSchema = z.object({
  totalExperience: z.number(),
  totalCompanies: z.number().int(),
  totalProjects: z.number().int(),
  totalTechnologies: z.number().int(),
  currentPosition: z.boolean(),
  lastUpdated: z.string(),
}) satisfies z.ZodType<PortfolioStats>;

/** `/api/utils/format-date/:date` payload. */
export const formattedDateSchema = z.object({ formatted: z.string() });
