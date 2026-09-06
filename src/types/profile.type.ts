/** The owner's profile as returned by `/api/me`. */
export type Profile = {
  _id: string;
  type: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  industry: string | null;
  location: string | null;
  birthDate: string | null;
  website: string | null;
  twitterHandles: string[];
};
