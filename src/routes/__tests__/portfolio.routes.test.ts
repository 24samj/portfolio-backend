import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "@/index";
import type { Experience } from "@/types/experience.type";
import type { Portfolio } from "@/types/portfolio.type";
import type { Skill, SkillCategory } from "@/types/skill.type";
import type { Work } from "@/types/work.type";

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
      false,
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

  it("narrows by ?ids and serves the curated screenshots as seeded", async () => {
    const res = await get("/api/works?ids=eazydukan,%20rhia,");
    const body = (await res.json()) as List<Work>;

    expect(body.count).toBe(2);
    expect(body.data.map((w) => w._id).sort()).toEqual(["eazydukan", "rhia"]);
    const eazydukan = body.data.find((w) => w._id === "eazydukan");
    expect(eazydukan?.screenshots).toHaveLength(19);
    expect(eazydukan?.screenshots[0]).toBe(
      "https://images.sumit.codes/portfolio/works/eazydukan/mobile/01-home.jpg"
    );
    expect(body.data.every((w) => w.rating === 0)).toBe(true);
  });

  it("400s an ?ids with nothing in it", async () => {
    const res = await get("/api/works?ids=,%20,");

    expect(res.status).toBe(400);
  });

  it("puts featured works first, seed order otherwise", async () => {
    const all = (await (await get("/api/works")).json()) as List<Work>;
    const flags = all.data.map((w) => w.featured);
    const lastFeatured = flags.lastIndexOf(true);
    expect(flags.indexOf(false)).toBeGreaterThan(lastFeatured);
    expect(all.data.slice(0, 2).map((w) => w._id)).toEqual(["zluper", "bvmrf"]);

    const narrowed = (await (
      await get("/api/works?ids=eazydukan,zluper")
    ).json()) as List<Work>;
    expect(narrowed.data.map((w) => w._id)).toEqual(["zluper", "eazydukan"]);
  });

  it("treats a bare ?ids= as no filter", async () => {
    const res = await get("/api/works?ids=");
    const body = (await res.json()) as List<Work>;

    expect(res.status).toBe(200);
    expect(body.count).toBe(12);
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
        totalProjects: 12,
        currentPosition: true,
        totalTechnologies: 20,
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

describe("GET /api/portfolio", () => {
  it("returns every resource in one response", async () => {
    const res = await get("/api/portfolio");
    const body = (await res.json()) as Item<Portfolio>;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Object.keys(body.data).sort()).toEqual([
      "certifications",
      "educations",
      "experiences",
      "profile",
      "skills",
      "stats",
      "works",
    ]);
    expect(body.data.profile).not.toBeNull();
    expect(body.data.skills.length).toBeGreaterThan(0);
    expect(body.data.experiences.length).toBeGreaterThan(0);
    expect(body.data.educations.length).toBeGreaterThan(0);
    expect(body.data.certifications.length).toBeGreaterThan(0);
    expect(body.data.works.length).toBeGreaterThan(0);
    expect(body.data.stats.totalCompanies).toBeGreaterThan(0);
  });

  it("carries the same rows as the per-resource routes", async () => {
    const aggregate = (await (
      await get("/api/portfolio")
    ).json()) as Item<Portfolio>;
    const works = (await (await get("/api/works")).json()) as List<Work>;
    const experiences = (await (
      await get("/api/experiences")
    ).json()) as List<Experience>;

    expect(aggregate.data.works).toEqual(works.data);
    expect(aggregate.data.experiences).toEqual(experiences.data);
  });
});

describe("caching", () => {
  it("holds a success and varies it by origin", async () => {
    const res = await get("/api/portfolio");

    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
    );
    expect(res.headers.get("Vary")).toBe("Origin");
  });

  it("never holds a 404", async () => {
    const res = await get("/api/works/not-a-real-work");

    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBeNull();
  });
});
