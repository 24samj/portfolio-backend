import nodemailer from "nodemailer";
import { z } from "zod";
import { ContactFormData, EmailResult } from "../types/ClosedTest";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Send contact form email
   */
  static async sendContactEmail(formData: ContactFormData): Promise<EmailResult> {
    try {
      // Validate form data
      const validatedData = contactFormSchema.parse(formData);

      const transporter = this.getTransporter();

      // Email template
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8b5cf6; margin-bottom: 20px;">New Contact Form Submission</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">Contact Details</h3>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">Message</h3>
            <p style="line-height: 1.6; white-space: pre-wrap;">${validatedData.message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 14px;">
              This email was sent from the contact form on sumit.codes
            </p>
          </div>
        </div>
      `;

      // Send email
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: "hi@sumit.codes",
        subject: `Contact Form: Message from ${validatedData.name}`,
        html: emailHtml,
        replyTo: validatedData.email,
      });

      return {
        success: true,
        message:
          "Your message has been sent successfully! I'll get back to you soon.",
      };
    } catch (error) {
      console.error("Error sending email:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: error.issues[0].message,
        };
      }

      return {
        success: false,
        message:
          "Sorry, there was an error sending your message. Please try again or contact me directly.",
      };
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("Email configuration test failed:", error);
      return false;
    }
  }
}
