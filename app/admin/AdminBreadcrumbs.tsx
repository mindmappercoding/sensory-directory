"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  admin: "Dashboard",     // 👈 this is the key bit
  venues: "Venues",
  submissions: "Submissions",
  reports: "Reports",
};

function buildCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean); // ["admin", "venues", ...]
  const crumbs: { href: string; label: string }[] = [];

  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const label = LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ href, label });
  }

  return crumbs;
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <BreadcrumbItem key={crumb.href}>
              {isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
