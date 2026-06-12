import { withMongo } from "../database/withMongo";
import { COLLECTIONS } from "../constants";
import { PortfolioStats } from "../types/Stats";
import { MongoCompanyDocument, MongoSkillCategoryDocument } from "../types/MongoDB";

const DATABASE_NAME = "portfolio2";

export class StatsService {
  /**
   * Total experience in decimal years, rounded to one decimal place.
   * Each calendar month worked is counted once, so overlapping positions
   * don't inflate the total.
   */
  static calculateTotalExperience(
    companies: Pick<MongoCompanyDocument, "workStart" | "workEnd">[]
  ): number {
    if (companies.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueMonths = new Set<string>();
    companies.forEach((company) => {
      const start = new Date(company.workStart);
      start.setHours(0, 0, 0, 0);
      const end = company.workEnd ? new Date(company.workEnd) : today;
      end.setHours(0, 0, 0, 0);

      const current = new Date(start);
      while (current <= end) {
        const month = current.getMonth() + 1;
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        uniqueMonths.add(`${current.getFullYear()}-${monthStr}`);
        current.setMonth(current.getMonth() + 1);
      }
    });

    return Math.round((uniqueMonths.size / 12) * 10) / 10;
  }

  static async getStats(uri: string): Promise<PortfolioStats> {
    try {
      const { companies, totalProjects, totalTechnologies } = await withMongo(
        uri,
        DATABASE_NAME,
        async (db) => {
          const [companiesArray, projectsCount, skillCategories] = await Promise.all([
            db.collection<MongoCompanyDocument>(COLLECTIONS.EXPERIENCES).find({}).toArray(),
            db.collection(COLLECTIONS.WORKS).countDocuments(),
            db.collection<MongoSkillCategoryDocument>(COLLECTIONS.SKILLS).find({}).toArray(),
          ]);

          const uniqueTechnologies = new Set<string>();
          for (const category of skillCategories) {
            if (Array.isArray(category.skills)) {
              for (const skill of category.skills) {
                if (skill.name && typeof skill.name === "string" && skill.name.trim().length > 0) {
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
        }
      );

      const currentPosition = companies.some((company) => !company.workEnd);
      const totalCompanies = companies.length;

      const totalExperience = StatsService.calculateTotalExperience(companies);

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

  static formatExpDate(date: string | null): string {
    if (!date || date === "null") return "Present";
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString("default", { month: "short" });
    return `${month} ${dateObj.getFullYear()}`;
  }
}
