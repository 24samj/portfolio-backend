import { ObjectId } from "mongodb";
import { withMongo } from "../database/withMongo";
import { Experience } from "../types/Company";
import { COLLECTIONS } from "../constants";
import { MongoCompanyDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.EXPERIENCES;
const DATABASE_NAME = "portfolio2";

export class ExperienceService {
  static async getAll(uri: string): Promise<Experience[]> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      const experiences = await collection.find({}).toArray();

      const sorted = experiences.sort((a, b) => {
        if (a.workEnd === null && b.workEnd !== null) return -1;
        if (a.workEnd !== null && b.workEnd === null) return 1;
        if (a.workEnd === null && b.workEnd === null) {
          return new Date(a.workStart).getTime() - new Date(b.workStart).getTime();
        }
        if (a.workEnd !== null && b.workEnd !== null) {
          return new Date(b.workStart).getTime() - new Date(a.workStart).getTime();
        }
        return 0;
      });

      return sorted.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
      })) as Experience[];
    });
  }

  static async getById(uri: string, id: string): Promise<Experience | null> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoCompanyDocument>(COLLECTION_NAME);
      let experience: MongoCompanyDocument | null;
      try {
        experience = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        experience = await collection.findOne({ _id: id as unknown as ObjectId });
      }

      if (!experience) {
        return null;
      }

      return {
        ...experience,
        _id: experience._id.toString(),
      } as Experience;
    });
  }

  static async getCount(uri: string): Promise<number> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      return collection.countDocuments();
    });
  }
}
