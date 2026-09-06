import type { ExperienceType, Gradient } from "@/db/schema";

/** An experience (employer + role) as returned by `/api/experiences`. */
export type Experience = {
  _id: string;
  name: string;
  role: string;
  workStart: string;
  /** Null for the current position. */
  workEnd: string | null;
  location: string;
  description: string;
  type: ExperienceType;
  /** Ids into `/api/works`. */
  works: string[];
  gradient: Gradient;
};
