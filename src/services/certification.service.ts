import { eq } from "drizzle-orm";
import { type CertificationRow, certifications, getDb } from "@/db";
import type { Certification } from "@/types/certification.type";

export function toCertification(row: CertificationRow): Certification {
  return {
    _id: row.id,
    name: row.name,
    issuer: row.issuer,
    date: row.date,
    credentialID: row.credentialId || null,
    // Omitted rather than null: the frontend renders the link on truthiness and
    // the old API never sent the key when empty.
    link: row.link || undefined,
  };
}

/** Newest first. Dates are "Nov 2023" style, which `Date` parses. */
export function sortCertifications(
  rows: CertificationRow[]
): CertificationRow[] {
  return rows
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function listCertifications(
  d1: D1Database
): Promise<Certification[]> {
  const rows = await getDb(d1).select().from(certifications);
  return sortCertifications(rows).map(toCertification);
}

export async function getCertification(
  d1: D1Database,
  id: string
): Promise<Certification | null> {
  const row = await getDb(d1)
    .select()
    .from(certifications)
    .where(eq(certifications.id, id))
    .get();
  return row ? toCertification(row) : null;
}
