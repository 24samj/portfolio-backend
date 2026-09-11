import type { Certification } from "@/types/certification.type";
import type { Education } from "@/types/education.type";
import type { Experience } from "@/types/experience.type";
import type { Profile } from "@/types/profile.type";
import type { SkillCategory } from "@/types/skill.type";
import type { PortfolioStats } from "@/types/stats.type";
import type { Work } from "@/types/work.type";

/** Every read-only resource, as `/api/portfolio` returns them together. */
export type Portfolio = {
  /** Null rather than a 404: the aggregate always resolves. */
  profile: Profile | null;
  skills: SkillCategory[];
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  works: Work[];
  stats: PortfolioStats;
};
