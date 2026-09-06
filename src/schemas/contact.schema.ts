import { z } from "zod";
import type { ContactRequest } from "@/types/contact.type";

/** `POST /api/contact` body. Messages are shown verbatim by the form. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
}) satisfies z.ZodType<ContactRequest>;
