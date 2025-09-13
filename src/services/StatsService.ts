import { COLLECTIONS } from "../constants";
import { getDatabase } from "../database/connection";
import { PortfolioStats } from "../types/ClosedTest";

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
      const db = await getDatabase();
      const companiesCollection = db.collection(COLLECTIONS.COMPANIES);

      // Get all companies
      const companies = await companiesCollection.find({}).toArray();

      // Calculate total experience
      const currentPosition = companies.some((company) => !company.workEnd);
      const totalCompanies = companies.length;

      // Calculate total projects
      const totalProjects = companies.reduce((acc, company) => {
        return (
          acc +
          (company.playStoreApps?.length || 0) +
          (company.appStoreApps?.length || 0) +
          (company.webApps?.length || 0)
        );
      }, 0);

      // Get unique technologies
      const allTechnologies = companies.flatMap(
        (company) => company.technologies || []
      );
      const uniqueTechnologies = [...new Set(allTechnologies)];
      const totalTechnologies = uniqueTechnologies.length;

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
