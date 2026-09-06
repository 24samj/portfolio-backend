import { env } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import app from "@/index";
import type { Experience } from "@/types/experience.type";
import type { Skill, SkillCategory } from "@/types/skill.type";
import type { Work } from "@/types/work.type";

// The store scrapers hit apple.com / play.google.com. Fail them here so the
// list falls back to seeded values, which is also the path worth asserting.
vi.mock("@/services/AppStoreService", () => ({
  AppStoreService: {
    getAppStoreApp: vi.fn().mockRejectedValue(new Error("offline")),
  },
}));
vi.mock("@/services/PlayStoreService", () => ({
  PlayStoreService: {
    getApp: vi.fn().mockRejectedValue(new Error("offline")),
  },
}));

type List<T> = { success: true; count: number; data: T[] };
type Item<T> = { success: true; data: T };

const get = (path: string) => app.request(path, {}, env);

describe("GET /api/health", () => {
  it("reports the database connected", async () => {
    const res = await get("/api/health");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      status: "ok",
      services: { database: "connected" },
    });
  });
});

describe("GET /api/experiences", () => {
  it("lists every seeded experience, current positions first", async () => {
    const res = await get("/api/experiences");
    const body = (await res.json()) as List<Experience>;

    expect(res.status).toBe(200);
    expect(body.count).toBe(5);
    expect(body.data.map((e) => e.workEnd === null)).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
    expect(body.data[0]).toMatchObject({
      _id: expect.any(String),
      gradient: { from: expect.any(String), to: expect.any(String) },
      works: expect.any(Array),
    });
  });

  it("404s an unknown id with the shared envelope", async () => {
    const res = await get("/api/experiences/nope");

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: "Experience not found",
      message: "No experience found with the provided ID",
    });
  });
});

describe("GET /api/works", () => {
  it("returns the nested description and real booleans", async () => {
    const res = await get("/api/works/eazydukan");
    const body = (await res.json()) as Item<Work>;

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      _id: "eazydukan",
      description: { short: expect.any(String), long: expect.any(String) },
      isInternal: false,
      featured: false,
      technologies: expect.arrayContaining(["React Native"]),
    });
  });

  it("narrows by ?ids and keeps the seeded rating when stores are down", async () => {
    const res = await get("/api/works?ids=eazydukan,%20rhia,");
    const body = (await res.json()) as List<Work>;

    expect(body.count).toBe(2);
    expect(body.data.map((w) => w._id).sort()).toEqual(["eazydukan", "rhia"]);
    expect(body.data.every((w) => w.rating === 0)).toBe(true);
  });

  it("400s an ?ids with nothing in it", async () => {
    const res = await get("/api/works?ids=,%20,");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/skills", () => {
  it("nests sorted skills under each category", async () => {
    const res = await get("/api/skills");
    const body = (await res.json()) as List<SkillCategory>;

    expect(body.count).toBe(7);
    const languages = body.data.find(
      (c) => c.category === "Programming Languages"
    );
    expect(languages?.proficiency).toBe("Expert");
    expect(languages?.skills.map((s) => s.name)).toEqual([
      "CSS",
      "HTML",
      "JavaScript",
      "TypeScript",
    ]);
  });

  it("flattens one category by title", async () => {
    const res = await get("/api/skills/category/State%20Management");
    const body = (await res.json()) as List<Skill>;

    expect(body.count).toBe(4);
    expect(body.data[0]).toMatchObject({
      category: "State Management",
      _id: expect.stringContaining("-"),
    });
  });

  it("is empty for an unknown category", async () => {
    const res = await get("/api/skills/category/Nope");

    await expect(res.json()).resolves.toMatchObject({ count: 0, data: [] });
  });
});

describe("the rest of the read surface", () => {
  it("lists educations newest first", async () => {
    const res = await get("/api/educations");
    const body = (await res.json()) as List<{ endDate: string }>;

    expect(body.count).toBe(4);
    expect(body.data[0].endDate).toBe("Sep 2023");
  });

  it("lists certifications with the legacy credentialID casing", async () => {
    const res = await get("/api/certifications");
    const body = (await res.json()) as List<{ credentialID: string | null }>;

    expect(body.count).toBe(9);
    expect(body.data[0]).toHaveProperty("credentialID");
  });

  it("returns the profile", async () => {
    const res = await get("/api/me");

    await expect(res.json()).resolves.toMatchObject({
      data: { firstName: "Sumit", type: "profile", twitterHandles: [] },
    });
  });

  it("computes stats from the seeded rows", async () => {
    const res = await get("/api/stats");

    await expect(res.json()).resolves.toMatchObject({
      data: {
        totalCompanies: 5,
        totalProjects: 17,
        currentPosition: true,
        totalTechnologies: expect.any(Number),
      },
    });
  });

  it("formats an experience date", async () => {
    const res = await get("/api/utils/format-date/null");

    await expect(res.json()).resolves.toMatchObject({
      data: { formatted: "Present" },
    });
  });

  it("404s an unknown route with the shared envelope", async () => {
    const res = await get("/api/does-not-exist");

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: "Not found",
    });
  });
});
