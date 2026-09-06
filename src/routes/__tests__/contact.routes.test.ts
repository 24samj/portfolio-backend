import { env as testEnv } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { contactRoutes } from "@/routes/contact.routes";
import type { Env } from "@/types/env.type";

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I'd like to talk about a project.",
};

/**
 * A fake `send_email` binding. The real one is a Miniflare simulation the pool
 * doesn't wire up, and what we care about here is what the route *hands* it and
 * how it maps success / failure back to the form.
 */
function fakeEnv(send: SendEmail["send"] = vi.fn().mockResolvedValue({})) {
  const env: Env = {
    PORTFOLIO_DB: testEnv.PORTFOLIO_DB,
    EMAIL: { send },
    CONTACT_FROM: "contact@sumit.codes",
    CONTACT_TO: "inbox@example.com",
  };
  return { env, send };
}

// Each test uses its own IP: the rate limiter allows one request per minute per
// IP for the contact route, and its map is module-scoped.
let ipCounter = 0;
const post = (env: Env, body: unknown, init: RequestInit = {}) =>
  contactRoutes.request(
    "/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CF-Connecting-IP": `10.0.0.${++ipCounter}`,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    },
    env
  );

describe("POST /contact", () => {
  it("mails the inbox and reports success", async () => {
    const { env, send } = fakeEnv();

    const res = await post(env, VALID);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "inbox@example.com",
        from: { email: "contact@sumit.codes", name: "Portfolio Contact" },
        replyTo: { email: VALID.email, name: VALID.name },
        subject: `Contact Form: Message from ${VALID.name}`,
        text: expect.stringContaining(VALID.message),
      })
    );
  });

  it("escapes visitor input in the HTML part", async () => {
    const { env, send } = fakeEnv();

    await post(env, {
      ...VALID,
      message: "<script>alert(1)</script> hi there",
    });

    const [call] = vi.mocked(send).mock.calls;
    const message = call[0] as { html?: string };
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
  });

  it("400s a too-short name with the form's message", async () => {
    const { env, send } = fakeEnv();

    const res = await post(env, { ...VALID, name: "A" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      success: false,
      message: "Name must be at least 2 characters",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("400s an invalid email", async () => {
    const { env } = fakeEnv();

    const res = await post(env, { ...VALID, email: "not-an-email" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Please enter a valid email address",
    });
  });

  it("400s a body that isn't JSON", async () => {
    const { env } = fakeEnv();

    const res = await post(env, "not json");

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });

  it("500s with the fallback message when the binding throws", async () => {
    const { env } = fakeEnv(
      vi.fn().mockRejectedValue(new Error("E_DELIVERY_FAILED"))
    );

    const res = await post(env, VALID);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: expect.stringContaining("error sending your message"),
    });
  });

  it("429s a second submission from the same IP inside the window", async () => {
    const { env } = fakeEnv();
    const headers = {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.1",
    };
    const body = JSON.stringify(VALID);

    const first = await contactRoutes.request(
      "/",
      { method: "POST", headers, body },
      env
    );
    const second = await contactRoutes.request(
      "/",
      { method: "POST", headers, body },
      env
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});
