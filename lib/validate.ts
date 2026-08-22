import { ApiError } from "./api";

export const MAX_CHOICES = 30;
export const MAX_PARTICIPANTS = 25;
const MAX_TITLE = 80;
const MAX_NAME = 24;
const MAX_LABEL = 80;

function collapse(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function cleanTitle(value: unknown): string {
  const title = collapse(value);
  if (!title) throw new ApiError(400, "Say what y'all are deciding.");
  return title.slice(0, MAX_TITLE);
}

export function cleanName(value: unknown): string {
  const name = collapse(value);
  if (!name) throw new ApiError(400, "Add your name so folks know who is in.");
  return name.slice(0, MAX_NAME);
}

/** Returns null for blanks so callers can filter a pasted list. */
export function cleanChoiceLabel(value: unknown): string | null {
  const label = collapse(value);
  return label ? label.slice(0, MAX_LABEL) : null;
}

export function requireChoiceLabel(value: unknown): string {
  const label = cleanChoiceLabel(value);
  if (!label) throw new ApiError(400, "Type something to add.");
  return label;
}
