/** Headline numbers for the hero, as returned by `/api/stats`. */
export type PortfolioStats = {
  /** Decimal years, one decimal place. Overlapping months count once. */
  totalExperience: number;
  totalCompanies: number;
  totalProjects: number;
  /** Distinct skill names across every category. */
  totalTechnologies: number;
  /** True while any experience has no end date. */
  currentPosition: boolean;
  lastUpdated: string;
};
