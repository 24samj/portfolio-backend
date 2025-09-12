export interface Company {
  _id: string;
  companyName: string;
  position: string;
  workStart: string;
  workEnd?: string | null;
  description: string;
  technologies: string[];
  logo?: string;
  website?: string;
  location?: string;
}
