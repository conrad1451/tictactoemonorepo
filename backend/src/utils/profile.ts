// backend/src/utils/profile.ts

export interface Profile {
  name?: string;
  email?: string;
}

/** Keeps only non-empty strings, so a blank token claim never overwrites stored data. */
export const pickProfile = (user?: { name?: unknown; email?: unknown } | null): Profile => {
  const out: Profile = {};
  if (typeof user?.name === "string" && user.name.trim()) out.name = user.name.trim();
  if (typeof user?.email === "string" && user.email.trim()) out.email = user.email.trim();
  return out;
};
