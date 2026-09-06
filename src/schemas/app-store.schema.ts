import { z } from "zod";
import type { AppStoreApp } from "@/types/app-store.type";

/** Documentation only (see `AppStoreApp`). */
export const appStoreAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  screenshots: z.array(z.string()),
  appStoreUrl: z.string(),
  version: z.string(),
  rating: z.number(),
  ratingCount: z.number(),
  price: z.number(),
  currency: z.string(),
  developer: z.string(),
  category: z.string(),
  releaseDate: z.string(),
  size: z.string(),
}) satisfies z.ZodType<AppStoreApp>;
