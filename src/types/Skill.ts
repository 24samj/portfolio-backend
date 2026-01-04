export interface Skill {
  _id: string;
  name: string;
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  description: string;
  category: string;
  icon?: string;
}
