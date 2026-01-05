export interface Info {
  _id: string;
  type: string; // e.g., "profile"
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  industry?: string;
  location?: string;
  birthDate?: string;
  website?: string;
  twitterHandles?: string[];
}
