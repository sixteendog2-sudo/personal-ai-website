export const ADMIN_COOKIE_NAME = "personal_ai_admin";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "demo123456";
}

export function getAdminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN ?? "demo-admin-session";
}

export function isValidAdminPassword(password: string) {
  return password === getAdminPassword();
}

