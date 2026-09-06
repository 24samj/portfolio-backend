/** `POST /api/contact` body — what the site's contact form submits. */
export type ContactRequest = {
  name: string;
  email: string;
  message: string;
};

/** The response envelope the contact form renders. */
export type ContactResponse = {
  success: boolean;
  message: string;
};
