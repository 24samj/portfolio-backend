import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { corsMiddleware } from "@/middleware/cors";

/** The middleware alone, on a bare app, so the assertions are only about CORS. */
const app = new Hono();
app.use("*", corsMiddleware);
app.get("/ping", (c) => c.text("pong"));

describe("corsMiddleware", () => {
  it("echoes an allowed origin", async () => {
    const res = await app.request("/ping", {
      headers: { Origin: "https://sumit.codes" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://sumit.codes"
    );
  });

  it("omits the allow-origin header for an unknown origin", async () => {
    const res = await app.request("/ping", {
      headers: { Origin: "https://evil.example" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("answers preflight without hitting the route", async () => {
    const res = await app.request("/ping", {
      method: "OPTIONS",
      headers: { Origin: "https://sumit.codes" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
