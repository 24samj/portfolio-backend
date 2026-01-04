export interface Certification {
  _id: string;
  name: string;
  issuer: string;
  date: string;
  credentialID?: string | null;
  link?: string;
  description?: string;
  expiryDate?: string | null;
}
