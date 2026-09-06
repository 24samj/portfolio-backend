import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { rateLimitMiddleware } from "@/middleware/rate-limit";
import { contactResponseSchema, contactSchema } from "@/schemas/contact.schema";
import { sendContactEmail } from "@/services/contact.service";
import type { ContactResponse } from "@/types/contact.type";
import type { Env } from "@/types/env.type";
import { jsonRequestBody, jsonResponse } from "@/utils/openapi.util";
import { parseBody } from "@/utils/request.util";

/** The site's contact form. One endpoint: validate, mail the inbox, say so. */
export const contactRoutes = new Hono<{ Bindings: Env }>();

contactRoutes.post(
  "/",
  describeRoute({
    tags: ["Contact"],
    summary: "Send a contact-form message",
    description:
      "Mails the message to the site owner with Reply-To set to the visitor. Rate limited to one submission per minute per IP.",
    requestBody: jsonRequestBody("The form fields", contactSchema),
    responses: {
      200: jsonResponse("Sent", contactResponseSchema),
      400: jsonResponse(
        "Validation failed; `message` says why",
        contactResponseSchema
      ),
      429: jsonResponse("Rate limited", contactResponseSchema),
      500: jsonResponse("Delivery failed", contactResponseSchema),
    },
  }),
  rateLimitMiddleware("contact"),
  async (c) => {
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
  }
);
