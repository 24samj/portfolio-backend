import { withMongo } from "../database/withMongo";
import { Info } from "../types/Info";

const COLLECTION_NAME = "info";
const DATABASE_NAME = "portfolio2";

export class InfoService {
  static async getProfile(uri: string): Promise<Info | null> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      const profile = await collection.findOne({ type: "profile" });
      const info = profile || await collection.findOne({});

      if (!info) {
        return null;
      }

      return {
        ...info,
        _id: info._id.toString(),
      } as Info;
    });
  }
}
