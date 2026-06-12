import { withMongo } from "../database/withMongo";
import { COLLECTIONS } from "../constants";
import { StatsService } from "./StatsService";
import { Info } from "../types/Info";
import { MongoCompanyDocument } from "../types/MongoDB";

const COLLECTION_NAME = "info";
const DATABASE_NAME = "portfolio2";

// Matches "2 years of experience", "3.1+ years of experience", etc.
const EXPERIENCE_PHRASE = /\d+(?:\.\d+)?\+?\s+years\s+of\s+experience/i;

export class InfoService {
  static async getProfile(uri: string): Promise<Info | null> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection(COLLECTION_NAME);
      const profile = await collection.findOne({ type: "profile" });
      const info = profile || await collection.findOne({});

      if (!info) {
        return null;
      }

      // The stored summary goes stale; keep its experience figure in sync
      // with the same calculation /api/stats uses.
      let summary = info.summary;
      if (typeof summary === "string" && EXPERIENCE_PHRASE.test(summary)) {
        const companies = await db
          .collection<MongoCompanyDocument>(COLLECTIONS.EXPERIENCES)
          .find({})
          .toArray();
        const totalExperience = StatsService.calculateTotalExperience(companies);
        if (totalExperience > 0) {
          summary = summary.replace(
            EXPERIENCE_PHRASE,
            `${totalExperience}+ years of experience`
          );
        }
      }

      return {
        ...info,
        summary,
        _id: info._id.toString(),
      } as Info;
    });
  }
}
