// Simple in-memory registry that maps mobile numbers to signup details.
// Persists across navigation within the same session.

export interface RegisteredUser {
  mobile: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  customerCode?: string;
  customerForm?: Record<string, string>;
}

const registry = new Map<string, RegisteredUser>();

/** Normalise to last 10 digits */
function normaliseMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10);
}

/** Save / update a user on signup */
export function registerUser(user: RegisteredUser) {
  const key = normaliseMobile(user.mobile);
  registry.set(key, { ...user, mobile: key });
}

/** Retrieve previously-registered user by mobile */
export function getRegisteredUser(mobile: string): RegisteredUser | undefined {
  return registry.get(normaliseMobile(mobile));
}
