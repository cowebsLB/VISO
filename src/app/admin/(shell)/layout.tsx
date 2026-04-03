import { AdminNav } from "@/components/admin/AdminNav";
import { StaffOrderNotifications } from "@/components/admin/StaffOrderNotifications";
import { AdminUserMenu } from "@/components/admin/AdminUserMenu";
import { BRAND_NAME } from "@/lib/brand";
import type { ReactNode } from "react";

export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="font-display text-xl font-bold text-primary-700">
            {BRAND_NAME} admin
          </span>
          <AdminUserMenu />
        </div>
        <div className="mx-auto max-w-6xl">
          <AdminNav />
        </div>
      </header>
      <StaffOrderNotifications />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </>
  );
}
