import { ObjectId } from "mongodb";
import { withMongo } from "../database/withMongo";
import { Skill } from "../types/Skill";
import { COLLECTIONS } from "../constants";
import { MongoSkillCategoryDocument, MongoSkillDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.SKILLS;
const DATABASE_NAME = "portfolio2";

const proficiencyOrder: Record<string, number> = {
  Expert: 4,
  Advanced: 3,
  Intermediate: 2,
  Beginner: 1,
};

function sortSkills(skills: MongoSkillDocument[]): MongoSkillDocument[] {
  return skills.slice().sort((a, b) => {
    const diff = (proficiencyOrder[b.proficiency] || 0) - (proficiencyOrder[a.proficiency] || 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

function categoryToSkill(category: MongoSkillCategoryDocument, skills: MongoSkillDocument[]): Skill {
  const transformedSkills = skills.map((skill): Skill => ({
    _id: `${category._id.toString()}-${skill.name}`,
    name: skill.name,
    description: skill.description,
    category: category.title,
    icon: category.icon,
    proficiency: skill.proficiency,
  }));

  return {
    _id: category._id.toString(),
    name: category.title,
    description: category.title,
    category: category.title,
    icon: category.icon,
    proficiency: "Expert" as const,
    skills: transformedSkills,
  } as unknown as Skill;
}

export class SkillService {
  static async getAll(uri: string): Promise<Skill[]> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoSkillCategoryDocument>(COLLECTION_NAME);
      const categories = await collection.find({}).toArray() as MongoSkillCategoryDocument[];

      return categories.map((cat) => {
        const skills = Array.isArray(cat.skills) ? sortSkills(cat.skills) : [];
        return categoryToSkill(cat, skills);
      });
    });
  }

  static async getByCategory(uri: string, categoryTitle: string): Promise<Skill[]> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoSkillCategoryDocument>(COLLECTION_NAME);
      const categoryDoc = await collection.findOne({ title: categoryTitle }) as MongoSkillCategoryDocument | null;

      if (!categoryDoc || !Array.isArray(categoryDoc.skills)) {
        return [];
      }

      const sorted = sortSkills(categoryDoc.skills);
      return sorted.map((skill): Skill => ({
        _id: `${categoryDoc._id.toString()}-${skill.name}`,
        name: skill.name,
        description: skill.description,
        category: categoryDoc.title,
        icon: categoryDoc.icon,
        proficiency: skill.proficiency,
      }));
    });
  }

  static async getById(uri: string, id: string): Promise<Skill | null> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoSkillCategoryDocument>(COLLECTION_NAME);
      let categoryDoc: MongoSkillCategoryDocument | null;
      try {
        categoryDoc = await collection.findOne({ _id: new ObjectId(id) }) as MongoSkillCategoryDocument | null;
      } catch {
        return null;
      }

      if (!categoryDoc || !Array.isArray(categoryDoc.skills)) {
        return null;
      }

      const firstSkill = categoryDoc.skills[0];
      return {
        _id: categoryDoc._id.toString(),
        name: categoryDoc.title,
        description: categoryDoc.title,
        category: categoryDoc.title,
        icon: categoryDoc.icon,
        proficiency: firstSkill.proficiency,
      };
    });
  }

  static async getCount(uri: string): Promise<number> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      return collection.countDocuments();
    });
  }
}
