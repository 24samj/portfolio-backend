import type { ContactRequest } from "@/types/contact.type";
import type { Env } from "@/types/env.type";

/** Escape user text for the HTML part. The visitor controls every field. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function renderHtml(data: ContactRequest): string {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const message = escapeHtml(data.message).replace(/\n/g, "<br>");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #8b5cf6; margin-bottom: 20px;">New Contact Form Submission</h2>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Contact Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #333;">Message</h3>
        <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
      </div>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px;">
          This email was sent from the contact form on sumit.codes
        </p>
      </div>
    </div>
  `;
}

/** Plain-text twin of the HTML part. Spam filters penalise HTML-only mail. */
function renderText(data: ContactRequest): string {
  return [
    "New contact form submission",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    "",
    "Message:",
    data.message,
    "",
    "Sent from the contact form on sumit.codes",
  ].join("\n");
}

/**
 * Deliver a contact-form submission to the inbox. `data` is already validated
 * (`contactSchema`). The binding is locked to one destination in wrangler.jsonc,
 * so a bad CONTACT_TO fails loudly rather than mailing a stranger. Throws on a
 * send failure; the route decides what the visitor sees.
 */
export async function sendContactEmail(
  env: Env,
  data: ContactRequest
): Promise<void> {
  await env.EMAIL.send({
    to: env.CONTACT_TO,
    from: { email: env.CONTACT_FROM, name: "Portfolio Contact" },
    // Hitting Reply in the inbox answers the visitor, not the form address.
    replyTo: { email: data.email, name: data.name },
    subject: `Contact Form: Message from ${data.name}`,
    html: renderHtml(data),
    text: renderText(data),
  });
}
