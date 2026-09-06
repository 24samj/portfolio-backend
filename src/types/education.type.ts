/** An education entry as returned by `/api/educations`. */
export type Education = {
  _id: string;
  schoolName: string;
  startDate: string;
  endDate: string;
  degreeName: string;
  notes: string;
  activities: string;
};
