/** Bindings + vars on `c.env`. Mirrors wrangler.jsonc. */
export type Env = {
  /** D1 (SQLite) — the only store this worker has. Read-only, seeded by migration. */
  PORTFOLIO_DB: D1Database;
  /** Contact-form outbound mail. Locked to CONTACT_TO by the binding config. */
  EMAIL: SendEmail;
  /** Sender on the Email-Routing-enabled zone. Non-secret. */
  CONTACT_FROM: string;
  /** The verified destination the contact form delivers to. Non-secret. */
  CONTACT_TO: string;
};
