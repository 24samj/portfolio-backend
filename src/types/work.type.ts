import type { WorkType } from "@/db/schema";

/** A project as returned by `/api/works`. */
export type Work = {
  _id: string;
  name: string;
  description: { short: string; long: string };
  icon: string;
  /** Store genre; filled by store enrichment when the seed leaves it empty. */
  category: string;
  type: WorkType;
  appStoreId: string | null;
  playStoreId: string | null;
  isInternal: boolean;
  featured: boolean;
  /** Slug into `/api/experiences`. */
  companyId: string | null;
  technologies: string[];
  rating: number;
  screenshots: string[];
  webUrls: string[] | null;
  sourceCode: string | null;
  googleGroupUrl: string | null;
};
