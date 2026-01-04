import { executeWithDatabaseTimeout } from "../database/connection";
import { Skill } from "../types/Skill";
import { COLLECTIONS } from "../constants";
import { MongoSkillCategoryDocument, MongoSkillDocument } from "../types/MongoDB";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = COLLECTIONS.SKILLS;
const DATABASE_NAME = "portfolio2";

/**
 * Service for managing skill data
 * Uses optimized database connection with caching
 */
export class SkillService {
  /**
   * Get all skills with optimized sorting
   */
  static async getAll(): Promise<Skill[]> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoSkillCategoryDocument>(COLLECTION_NAME);
      const skillCategories = await collection.find({}).toArray() as MongoSkillCategoryDocument[];

      // Sort skills within each category by proficiency (Expert > Advanced > Intermediate > Beginner), then by name
      const proficiencyOrder: Record<string, number> = {
        Expert: 4,
        Advanced: 3,
        Intermediate: 2,
        Beginner: 1,
      };

      const sortedCategories = skillCategories.map((category: MongoSkillCategoryDocument) => {
        if (category.skills && Array.isArray(category.skills)) {
          const sortedSkills = category.skills.sort((a: MongoSkillDocument, b: MongoSkillDocument) => {
            const aOrder = proficiencyOrder[a.proficiency] || 0;
            const bOrder = proficiencyOrder[b.proficiency] || 0;
            
            if (bOrder !== aOrder) {
              return bOrder - aOrder;
            }
            return a.name.localeCompare(b.name);
          });
          
          // Transform skills to API format
          const transformedSkills = sortedSkills.map((skill: MongoSkillDocument): Skill => {
            return {
              _id: `${category._id.toString()}-${skill.name}`, // Generate unique ID from category + skill name
              name: skill.name,
              description: skill.description,
              category: category.title,
              icon: category.icon,
              proficiency: skill.proficiency,
            };
          });
          
          return {
            _id: category._id.toString(),
            name: category.title,
            description: category.title, // Use title as description for category
            category: category.title,
            icon: category.icon,
            proficiency: "Expert" as const, // Category level proficiency
            skills: transformedSkills,
          } as unknown as Skill;
        }
        return {
          _id: category._id.toString(),
          name: category.title,
          description: category.title,
          category: category.title,
          icon: category.icon,
          proficiency: "Expert" as const,
        } as Skill;
      });

      return sortedCategories as Skill[];
    }, DATABASE_NAME);
  }

  /**
   * Get skills by category (title)
   */
  static async getByCategory(categoryTitle: string): Promise<Skill[]> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoSkillCategoryDocument>(COLLECTION_NAME);
      const categoryDoc = await collection.findOne({ title: categoryTitle }) as MongoSkillCategoryDocument | null;

      if (!categoryDoc || !categoryDoc.skills || !Array.isArray(categoryDoc.skills)) {
        return [];
      }

      // Sort by proficiency (Expert > Advanced > Intermediate > Beginner), then by name
      const proficiencyOrder: Record<string, number> = {
        Expert: 4,
        Advanced: 3,
        Intermediate: 2,
        Beginner: 1,
      };

      const sorted = categoryDoc.skills.sort((a: MongoSkillDocument, b: MongoSkillDocument) => {
        const aOrder = proficiencyOrder[a.proficiency] || 0;
        const bOrder = proficiencyOrder[b.proficiency] || 0;
        
        if (bOrder !== aOrder) {
          return bOrder - aOrder;
        }
        return a.name.localeCompare(b.name);
      });

      // Transform to API format
      return sorted.map((skill: MongoSkillDocument): Skill => {
        return {
          _id: `${categoryDoc._id.toString()}-${skill.name}`,
          name: skill.name,
          description: skill.description,
          category: categoryDoc.title,
          icon: categoryDoc.icon,
          proficiency: skill.proficiency,
        };
      });
    }, DATABASE_NAME);
  }

  /**
   * Get skill by ID with optimized error handling
   */
  static async getById(id: string): Promise<Skill | null> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection<MongoSkillCategoryDocument>(COLLECTION_NAME);
      let categoryDoc: MongoSkillCategoryDocument | null;
      try {
        categoryDoc = await collection.findOne({ _id: new ObjectId(id) }) as MongoSkillCategoryDocument | null;
      } catch {
        // If ObjectId conversion fails, return null
        return null;
      }

      if (!categoryDoc || !categoryDoc.skills || !Array.isArray(categoryDoc.skills)) {
        return null;
      }

      // Return the first skill from the category as a representative
      const firstSkill = categoryDoc.skills[0];
      
      return {
        _id: categoryDoc._id.toString(),
        name: categoryDoc.title,
        description: categoryDoc.title,
        category: categoryDoc.title,
        icon: categoryDoc.icon,
        proficiency: firstSkill.proficiency,
      };
    }, DATABASE_NAME);
  }

  /**
   * Get skills count for pagination (future use)
   */
  static async getCount(): Promise<number> {
    return executeWithDatabaseTimeout(async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      return await collection.countDocuments();
    }, DATABASE_NAME);
  }
}

// Backward compatibility exports
export const getSkills = SkillService.getAll;
export const getSkillById = SkillService.getById;
export const getSkillsByCategory = SkillService.getByCategory;
