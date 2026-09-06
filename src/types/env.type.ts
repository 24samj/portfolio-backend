/** Bindings + vars on `c.env`. Mirrors wrangler.jsonc. */
export type Env = {
  /** MongoDB Atlas connection string. Secret. Goes away with the D1 migration. */
  MONGODB_URI: string;
  /** Contact-form outbound mail. Locked to CONTACT_TO by the binding config. */
  EMAIL: SendEmail;
  /** Sender on the Email-Routing-enabled zone. Non-secret. */
  CONTACT_FROM: string;
  /** The verified destination the contact form delivers to. Non-secret. */
  CONTACT_TO: string;
};
