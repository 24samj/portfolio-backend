import { COLLECTIONS } from "../constants";
import { executeWithDatabaseTimeout } from "../database/connection";
import { PortfolioStats } from "../types/Stats";
import { MongoCompanyDocument, MongoSkillCategoryDocument } from "../types/MongoDB";

const DATABASE_NAME = "portfolio2"; // experiences, works, and skills are in portfolio2 database

export class StatsService {
  /**
   * Calculate total experience duration in days
   * Returns the number of days between start and end dates (inclusive)
   * For work experience, both start and end dates count as working days
   */
  private static calculateDaysDuration(
    startDate: Date,
    endDate: Date
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set to start of day to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return diffDays;
  }

  /**
   * Calculate total experience duration from earliest start to latest end
   * Uses day-based calculation for precision
   */
  private static calculateDuration(
    startDate: string,
    endDate: string | null
  ): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const days = this.calculateDaysDuration(start, end);
    const years = days / 365.25; // Account for leap years
    
    if (years === 0) {
      return "0.0";
    }
    
    return years.toFixed(1);
  }

  /**
   * Get portfolio statistics
   * Optimized to use a single database connection for all queries
   */
  static async getStats(): Promise<PortfolioStats> {
    try {
      // Use a single database connection for all queries to reduce latency
      const { companies, totalProjects, totalTechnologies } = await executeWithDatabaseTimeout(async (db) => {
        // Execute all queries in parallel within the same connection
        const [companiesArray, projectsCount, skillCategories] = await Promise.all([
          db.collection<MongoCompanyDocument>(COLLECTIONS.EXPERIENCES).find({}).toArray(),
          db.collection(COLLECTIONS.WORKS).countDocuments(),
          db.collection<MongoSkillCategoryDocument>(COLLECTIONS.SKILLS).find({}).toArray(),
        ]);
        
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
        
        return {
          companies: companiesArray,
          totalProjects: projectsCount,
          totalTechnologies: uniqueTechnologies.size,
        };
      }, DATABASE_NAME, 15000); // 15 second timeout for all queries combined

      // Calculate total experience
      const currentPosition = companies.some((company) => !company.workEnd);
      const totalCompanies = companies.length;

      // Calculate total experience duration by counting unique months
      // This properly handles overlapping experiences
      let totalExperience = 0.0;
      if (companies.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Collect all unique months worked
        const uniqueMonths = new Set<string>();
        
        companies.forEach((company) => {
          const start = new Date(company.workStart);
          start.setHours(0, 0, 0, 0);
          const end = company.workEnd ? new Date(company.workEnd) : today;
          end.setHours(0, 0, 0, 0);
          
          // Add each month in this experience period
          const current = new Date(start);
          while (current <= end) {
            const month = current.getMonth() + 1;
            const monthStr = month < 10 ? `0${month}` : `${month}`;
            const monthKey = `${current.getFullYear()}-${monthStr}`;
            uniqueMonths.add(monthKey);
            // Move to next month
            current.setMonth(current.getMonth() + 1);
          }
        });
        
        const totalUniqueMonths = uniqueMonths.size;
        
        if (totalUniqueMonths === 0) {
          totalExperience = 0.0;
        } else {
          // Convert months to years: 32 months = 2 years 8 months = 2.8 years
          // Calculate as: years + (remaining months / 10) for display
          const years = Math.floor(totalUniqueMonths / 12);
          const remainingMonths = totalUniqueMonths % 12;
          totalExperience = years + (remainingMonths / 10);
        }
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
