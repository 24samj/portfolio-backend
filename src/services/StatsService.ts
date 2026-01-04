import { COLLECTIONS } from "../constants";
import { executeWithDatabaseTimeout } from "../database/connection";
import { PortfolioStats } from "../types/Stats";
import { MongoCompanyDocument, MongoSkillCategoryDocument } from "../types/MongoDB";

const DATABASE_NAME = "portfolio2"; // experiences, works, and skills are in portfolio2 database

export class StatsService {
  /**
   * Calculate total experience duration
   */
  private static calculateDuration(
    startDate: string,
    endDate: string | null
  ): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();

    if (end.getDate() < start.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMonths = years * 12 + months;
    if (totalMonths === 0) {
      return "0.0";
    }
    const decimalYears = (totalMonths / 12).toFixed(1);
    return decimalYears;
  }

  /**
   * Get portfolio statistics
   */
  static async getStats(): Promise<PortfolioStats> {
    try {
      // Get experiences/companies
      const companies = await executeWithDatabaseTimeout(async (db) => {
        const collection = db.collection<MongoCompanyDocument>(COLLECTIONS.EXPERIENCES);
        return await collection.find({}).toArray();
      }, DATABASE_NAME);

      // Get total projects count from works collection
      const totalProjects = await executeWithDatabaseTimeout(async (db) => {
        const collection = db.collection(COLLECTIONS.WORKS);
        return await collection.countDocuments();
      }, DATABASE_NAME);

      // Get total unique technologies from skills collection
      const totalTechnologies = await executeWithDatabaseTimeout(async (db) => {
        const collection = db.collection<MongoSkillCategoryDocument>(COLLECTIONS.SKILLS);
        const skillCategories = await collection.find({}).toArray();
        
        // Collect all unique skill names across all categories
        const uniqueTechnologies = new Set<string>();
        for (const category of skillCategories) {
          if (category.skills && Array.isArray(category.skills)) {
            for (const skill of category.skills) {
              if (skill.name && typeof skill.name === 'string' && skill.name.trim().length > 0) {
                uniqueTechnologies.add(skill.name.trim());
              }
            }
          }
        }
        
        return uniqueTechnologies.size;
      }, DATABASE_NAME);

      // Calculate total experience
      const currentPosition = companies.some((company) => !company.workEnd);
      const totalCompanies = companies.length;

      // Calculate total experience duration
      let totalExperience = "0 years";
      if (companies.length > 0) {
        // Find the earliest start date
        const earliestStart = companies.reduce((earliest, company) => {
          const startDate = new Date(company.workStart);
          return startDate < earliest ? startDate : earliest;
        }, new Date(companies[0].workStart));

        // Find the latest end date (or current date if still working)
        const latestEnd = companies.reduce((latest, company) => {
          if (!company.workEnd) return new Date(); // Current position
          const endDate = new Date(company.workEnd);
          return endDate > latest ? endDate : latest;
        }, new Date(companies[0].workEnd || new Date()));

        totalExperience = this.calculateDuration(
          earliestStart.toISOString().split("T")[0],
          latestEnd.toISOString().split("T")[0]
        );
      }

      return {
        totalExperience,
        totalCompanies,
        totalProjects,
        totalTechnologies,
        currentPosition,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      throw new Error("Failed to calculate statistics");
    }
  }

  /**
   * Format experience date for display
   */
  static formatExpDate(date: string | null): string {
    if (!date || date === "null") return "Present";

    const dateObj = new Date(date);
    const month = dateObj.toLocaleString("default", { month: "short" });
    const year = dateObj.getFullYear();
    return `${month} ${year}`;
  }
}
