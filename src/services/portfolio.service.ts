import type { Portfolio } from "@/types/portfolio.type";
import { listCertifications } from "./certification.service";
import { listEducations } from "./education.service";
import { listExperiences } from "./experience.service";
import { getProfile } from "./profile.service";
import { listSkillCategories } from "./skill.service";
import { getStats } from "./stats.service";
import { listWorks } from "./work.service";

/**
 * The whole portfolio in one response, so a screen pays one round trip instead
 * of one per collection. Composed from the per-domain services, which keeps the
 * ordering and the row mappers defined in exactly one place.
 *
 * `getStats` reads experiences, works and skill categories again, so three of
 * these queries are duplicates. They run inside the same `Promise.all` against
 * a seeded dataset, and sharing the rows would mean exporting internals from
 * three services to save no measurable time.
 */
export async function getPortfolio(d1: D1Database): Promise<Portfolio> {
  const [
    profile,
    skills,
    experiences,
    educations,
    certifications,
    works,
    stats,
  ] = await Promise.all([
    getProfile(d1),
    listSkillCategories(d1),
    listExperiences(d1),
    listEducations(d1),
    listCertifications(d1),
    listWorks(d1),
    getStats(d1),
  ]);

  return {
    profile,
    skills,
    experiences,
    educations,
    certifications,
    works,
    stats,
  };
}
