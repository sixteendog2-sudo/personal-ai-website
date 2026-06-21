import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export const metadata = {
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const authenticated = Boolean(await verifyAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value));

  if (!authenticated) {
    return children;
  }

  return <AdminShell>{children}</AdminShell>;
}
