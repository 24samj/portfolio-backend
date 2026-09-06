/** A certification as returned by `/api/certifications`. */
export type Certification = {
  _id: string;
  name: string;
  issuer: string;
  date: string;
  credentialID: string | null;
  /** Omitted (not null) when absent — the frontend checks truthiness. */
  link?: string;
};
