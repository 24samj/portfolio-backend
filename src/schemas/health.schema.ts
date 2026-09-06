import { z } from "zod";

/** `/api/health` payload. Always HTTP 200; `status` carries the verdict. */
export const healthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  timestamp: z.string(),
  services: z.object({
    database: z.enum(["connected", "disconnected"]),
  }),
});
