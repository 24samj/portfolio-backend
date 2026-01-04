export interface Company {
  _id: string;
  name: string; // Company name
  role: string; // Position/role
  workStart: string;
  workEnd?: string | null;
  description: string;
  works?: string[]; // Array of work IDs
  logo?: string;
  website?: string;
  location?: string;
  type?: string; // Role type: FULL_TIME, PART_TIME, CONTRACT, FREELANCE
  color?: string; // Theme color for UI
}
