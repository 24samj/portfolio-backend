export interface ClosedTest {
  _id: string;
  appName: string;
  packageName: string;
  description: string;
  icon: string;
  googleGroup: string;
  playStoreUrl: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface AppStoreApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  screenshots: string[];
  appStoreUrl: string;
  version: string;
  rating: number;
  ratingCount: number;
  price: number;
  currency: string;
  developer: string;
  category: string;
  releaseDate: string;
  size: number;
}

export interface PlayStoreApp {
  id: string;
  name: string;
  description: string;
  summary: string;
  icon: string;
  screenshots: string[];
  playStoreUrl: string;
  version: string;
  rating: number;
  ratingCount: number;
  installs: string;
  price: number;
  free: boolean;
  developer: string;
  category: string;
  releaseDate: string;
  size: string;
  androidVersion: string;
  contentRating: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
}

export interface PortfolioStats {
  totalExperience: string;
  totalCompanies: number;
  totalProjects: number;
  totalTechnologies: number;
  currentPosition: boolean;
  lastUpdated: string;
}
