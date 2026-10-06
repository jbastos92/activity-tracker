import { z } from "zod";

export const ACTIVITY_NAME_MAX = 60;

export const activityNameSchema = z
  .string("Enter a name.")
  .trim()
  .min(1, "Enter a name.")
  .max(ACTIVITY_NAME_MAX, `Use ${ACTIVITY_NAME_MAX} characters or fewer.`);

/** The value stored in `Activity.nameKey`: names equal ignoring case and outer spaces share a key. */
export function toNameKey(name: string): string {
  return name.trim().toLowerCase();
}
