import { z } from "zod";

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

/** Default values for the create-ticket form (aligned with backend composeTicketDescription). */
export const createTicketDefaultValues = {
  title: "",
  location: "",
  categoryId: "",
  subCategoryId: "",
  priority: "Normal",
  description: "",
  preferredContactMethod: "Phone",
  preferredContactDetails: "",
};

/**
 * Detects strings made of a short substring repeated (e.g. "aaaaaaaaaa", "asasasasa", "1111111111").
 */
export function hasRepetitiveOrMeaninglessPattern(raw) {
  const s = String(raw || "").trim();
  if (s.length < 4) return false;
  for (let len = 1; len <= Math.min(4, Math.floor(s.length / 2)); len += 1) {
    const unit = s.slice(0, len);
    let built = "";
    while (built.length < s.length) built += unit;
    if (built.slice(0, s.length) === s) return true;
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ticketCreateFormSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    categoryId: z.string(),
    subCategoryId: z.string(),
    location: z.string(),
    priority: z.enum(["Low", "Normal", "High", "Critical"]),
    preferredContactMethod: z.enum(["Phone", "Email", "WhatsApp"]),
    preferredContactDetails: z.string(),
  })
  .superRefine((data, ctx) => {
    const title = data.title.trim();
    if (!title) {
      ctx.addIssue({ code: "custom", message: "Title is required.", path: ["title"] });
    } else if (title.length < 5) {
      ctx.addIssue({
        code: "custom",
        message: "Title must be at least 5 characters.",
        path: ["title"],
      });
    } else if (title.length > TITLE_MAX_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Title must be at most ${TITLE_MAX_LENGTH} characters.`,
        path: ["title"],
      });
    } else if (hasRepetitiveOrMeaninglessPattern(title)) {
      ctx.addIssue({
        code: "custom",
        message: "This title looks repetitive or meaningless. Please be more specific.",
        path: ["title"],
      });
    }

    const description = data.description.trim();
    if (!description) {
      ctx.addIssue({
        code: "custom",
        message: "Description is required.",
        path: ["description"],
      });
    } else if (description.length < 15) {
      ctx.addIssue({
        code: "custom",
        message: "Description must be at least 15 characters.",
        path: ["description"],
      });
    } else if (description.length > DESCRIPTION_MAX_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`,
        path: ["description"],
      });
    } else if (hasRepetitiveOrMeaninglessPattern(description)) {
      ctx.addIssue({
        code: "custom",
        message: "This description looks repetitive or meaningless. Please add more detail.",
        path: ["description"],
      });
    }

    if (!data.categoryId) {
      ctx.addIssue({
        code: "custom",
        message: "Please select a category from the list.",
        path: ["categoryId"],
      });
    }
    if (!data.subCategoryId) {
      ctx.addIssue({
        code: "custom",
        message: "Subcategory is required.",
        path: ["subCategoryId"],
      });
    }
    if (!data.location.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Resource / Location is required.",
        path: ["location"],
      });
    }

    const details = data.preferredContactDetails.trim();
    if (!details) {
      ctx.addIssue({
        code: "custom",
        message: "Preferred contact details are required.",
        path: ["preferredContactDetails"],
      });
    } else if (data.preferredContactMethod === "Email") {
      if (!EMAIL_RE.test(details)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid email address.",
          path: ["preferredContactDetails"],
        });
      }
    } else {
      const digits = details.replace(/\D/g, "");
      if (digits.length !== 10) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid 10-digit phone number.",
          path: ["preferredContactDetails"],
        });
      }
    }
  });
