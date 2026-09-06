import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "@/index";

type Spec = {
  openapi: string;
  paths: Record<string, Record<string, { tags?: string[] }>>;
};

describe("GET /openapi.json", () => {
  it("documents the /api surface and hides the legacy aliases", async () => {
    const res = await app.request("/openapi.json", {}, env);
    const spec = (await res.json()) as Spec;

    expect(res.status).toBe(200);
    expect(spec.openapi).toBe("3.1.0");

    const paths = Object.keys(spec.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/health",
        "/api/experiences",
        "/api/experiences/{id}",
        "/api/works",
        "/api/skills/category/{category}",
        "/api/contact",
        "/api/apps/play-store/{id}",
      ])
    );
    expect(paths.every((p) => p.startsWith("/api/"))).toBe(true);
    expect(spec.paths["/api/contact"].post.tags).toEqual(["Contact"]);
  });
});

describe("GET /docs", () => {
  it("serves the Scalar shell", async () => {
    const res = await app.request("/docs", {}, env);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    await expect(res.text()).resolves.toContain("/openapi.json");
  });
});
