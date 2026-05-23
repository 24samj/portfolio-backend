import { ObjectId } from "mongodb";

/**
 * MongoDB document types with ObjectId
 * These represent documents as stored in MongoDB (with ObjectId)
 */

/**
 * Individual skill within a category (nested in skills array)
 */
export interface MongoSkillDocument {
  name: string;
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  description: string;
}

/**
 * Skill category document (top-level in skills collection)
 */
export interface MongoSkillCategoryDocument {
  _id: ObjectId;
  title: string;
  icon: string;
  skills: MongoSkillDocument[];
}

export interface MongoWorkDocument {
  _id: string; // Works use string IDs, not ObjectId
  name: string;
  description: {
    short: string;
    long: string;
  };
  type: string;
  companyId: string | null;
  isInternal: boolean;
  featured: boolean;
  technologies: string[];
  appStoreId: string | null;
  playStoreId: string | null;
  webUrls: string[] | null;
  icon: string;
  category: string;
  rating: number;
  screenshots: string[];
  sourceCode: string | null;
  googleGroupUrl: string | null;
}

export interface MongoCompanyDocument {
  _id: ObjectId;
  name: string;
  role: string;
  workStart: string;
  workEnd?: string | null;
  description: string;
  works?: string[];
  logo?: string;
  website?: string;
  location?: string;
  type?: string;
  color?: string;
}

export interface MongoEducationDocument {
  _id: ObjectId;
  schoolName: string;
  startDate: string;
  endDate: string;
  degreeName: string;
  notes: string;
  activities: string;
}

export interface MongoCertificationDocument {
  _id: ObjectId;
  name: string;
  issuer: string;
  date: string;
  credentialID: string;
  link: string;
}

/**
 * Play Store / App Store data types
 */
export interface PlayStoreInitData {
  [key: string]: unknown;
}

export interface StructuredData {
  '@type'?: string;
  applicationCategory?: string;
  [key: string]: unknown;
}

