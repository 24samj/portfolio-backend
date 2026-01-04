import { MongoClient } from "mongodb";
import { COLLECTIONS } from "../constants";
import { getDatabase } from "../database/connection";
import { PortfolioStats } from "../types/Stats";

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
    let client: MongoClient | null = null;
    try {
      const { db, client: mongoClient } = await getDatabase();
      client = mongoClient;
      const companiesCollection = db.collection(COLLECTIONS.EXPERIENCES);

      // Get all companies with timeout protection
      const companies = await Promise.race([
        companiesCollection.find({}).toArray(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 5000)
        ),
      ]);

      // Calculate total experience
      const currentPosition = companies.some((company) => !company.workEnd);
      const totalCompanies = companies.length;

      // Calculate total projects from works array
      // Note: This is a simplified count - actual project count should come from works collection
      const totalProjects = companies.reduce((acc, company) => {
        return acc + (company.works?.length || 0);
      }, 0);

      // Technologies are now stored in skills collection, not in companies
      // This will be calculated separately from skills API
      const totalTechnologies = 0; // Will be fetched from skills API

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
    } finally {
      // Close connection after request
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // Ignore close errors
        }
      }
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
