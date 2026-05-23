import { ObjectId } from "mongodb";
import { withMongo } from "../database/withMongo";
import { Certification } from "../types/Certification";
import { COLLECTIONS } from "../constants";
import { MongoCertificationDocument } from "../types/MongoDB";

const COLLECTION_NAME = COLLECTIONS.CERTIFICATIONS;
const DATABASE_NAME = "portfolio2";

export class CertificationService {
  static async getAll(uri: string): Promise<Certification[]> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoCertificationDocument>(COLLECTION_NAME);
      const certifications = await collection.find({}).toArray() as MongoCertificationDocument[];

      const sorted = certifications.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return sorted.map((doc): Certification => ({
        _id: doc._id.toString(),
        name: doc.name,
        issuer: doc.issuer,
        date: doc.date,
        credentialID: doc.credentialID || null,
        link: doc.link || undefined,
      }));
    });
  }

  static async getById(uri: string, id: string): Promise<Certification | null> {
    return withMongo(uri, DATABASE_NAME, async (db) => {
      const collection = db.collection<MongoCertificationDocument>(COLLECTION_NAME);
      let certification: MongoCertificationDocument | null;
      try {
        certification = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        certification = await collection.findOne({ _id: id as unknown as ObjectId });
      }

      if (!certification) {
        return null;
      }

      return {
        _id: certification._id.toString(),
        name: certification.name,
        issuer: certification.issuer,
        date: certification.date,
        credentialID: certification.credentialID || null,
        link: certification.link || undefined,
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
