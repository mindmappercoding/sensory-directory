import type { ReactNode } from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header Bar */}
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">
                  Manage your sensory directory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumbs */}
        <AdminBreadcrumbs />
        
        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}