import { ObjectId } from "mongodb";
import { withMongo } from "../database/withMongo";
import { Education } from "../types/Education";
import { COLLECTIONS } from "../constants";
import { MongoEducationDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.EDUCATIONS;
const DATABASE_NAME = "portfolio2";

export class EducationService {
  static async getAll(uri: string): Promise<Education[]> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoEducationDocument>(COLLECTION_NAME);
      const educations = await collection.find({}).toArray() as MongoEducationDocument[];

      const sorted = educations.sort((a, b) => {
        if (!a.endDate && b.endDate) return -1;
        if (a.endDate && !b.endDate) return 1;
        if (a.endDate && b.endDate) {
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        }
        if (!a.endDate && !b.endDate) {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
        return 0;
      });

      return sorted.map((doc): Education => ({
        ...doc,
        _id: doc._id.toString(),
      }));
    });
  }

  static async getById(uri: string, id: string): Promise<Education | null> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoEducationDocument>(COLLECTION_NAME);
      let education: MongoEducationDocument | null;
      try {
        education = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        education = await collection.findOne({ _id: id as unknown as ObjectId });
      }

      if (!education) {
        return null;
      }

      return {
        ...education,
        _id: education._id.toString(),
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
