import { z } from "zod";
import type { PlayStoreApp } from "@/types/play-store.type";

/** Documentation only (see `PlayStoreApp`). Scraped, so most fields are optional. */
export const playStoreAppSchema = z.object({
  appId: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string().optional(),
  summary: z.string().optional(),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  score: z.number().optional(),
  scoreText: z.string().optional(),
  ratings: z.number().optional(),
  developer: z.string().optional(),
  genre: z.string().optional(),
  price: z.number().optional(),
  priceText: z.string().optional(),
  free: z.boolean().optional(),
  currency: z.string().optional(),
}) satisfies z.ZodType<PlayStoreApp>;
