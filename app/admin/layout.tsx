import type { ReactNode } from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl p-6 space-y-4">
      {/* Breadcrumbs at the top of every admin page */}
      <div className="px-6">
          <AdminBreadcrumbs />
      </div>
      {children}
    </main>
  );
}
