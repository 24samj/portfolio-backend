import { Hono } from "hono";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { contactSchema } from "@/schemas/contact.schema";
import { sendContactEmail } from "@/services/contact.service";
import type { ContactResponse } from "@/types/contact.type";
import type { Env } from "@/types/env.type";
import { parseBody } from "@/utils/request.util";

/** The site's contact form. One endpoint: validate, mail the inbox, say so. */
export const contactRoutes = new Hono<{ Bindings: Env }>();

contactRoutes.post("/", rateLimitMiddleware("contact"), async (c) => {
  const parsed = await parseBody(c, contactSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    await sendContactEmail(c.env, parsed.data);
  } catch (error) {
    console.error("Contact email failed:", error);
    const body: ContactResponse = {
      success: false,
      message:
        "Sorry, there was an error sending your message. Please try again or contact me directly.",
    };
    return c.json(body, 500);
  }

  const body: ContactResponse = {
    success: true,
    message:
      "Your message has been sent successfully! I'll get back to you soon.",
  };
  return c.json(body);
});
