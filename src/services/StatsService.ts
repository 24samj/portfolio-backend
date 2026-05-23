import { withMongo } from "../database/withMongo";
import { COLLECTIONS } from "../constants";
import { PortfolioStats } from "../types/Stats";
import { MongoCompanyDocument, MongoSkillCategoryDocument } from "../types/MongoDB";

const DATABASE_NAME = "portfolio2";

export class StatsService {
  private static calculateDaysDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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

      let totalExperience = 0.0;
      if (companies.length > 0) {
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

        const totalUniqueMonths = uniqueMonths.size;
        if (totalUniqueMonths > 0) {
          const years = Math.floor(totalUniqueMonths / 12);
          const remainingMonths = totalUniqueMonths % 12;
          totalExperience = years + remainingMonths / 10;
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

  static formatExpDate(date: string | null): string {
    if (!date || date === "null") return "Present";
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString("default", { month: "short" });
    return `${month} ${dateObj.getFullYear()}`;
  }
}
