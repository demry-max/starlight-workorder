"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "@/i18n/context";

const SUB_TAB_MAP: Record<string, string> = {
  "/admin/settings": "settings.smtp",
  "/admin/settings/statuses": "settings.statuses",
  "/admin/settings/users": "settings.users",
  "/admin/settings/sales-reps": "settings.salesReps",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPermissions(d.data.permissions);
        }
      })
      .catch(() => {});
  }, []);

  const allTabs = [
    { href: "/admin/settings", label: t("admin.settings.tabs.smtp"), permId: "settings.smtp" },
    { href: "/admin/settings/statuses", label: t("admin.settings.tabs.statuses"), permId: "settings.statuses" },
    { href: "/admin/settings/users", label: t("admin.settings.tabs.users"), permId: "settings.users" },
    { href: "/admin/settings/sales-reps", label: t("admin.settings.tabs.salesReps"), permId: "settings.salesReps" },
  ];

  const tabs = permissions
    ? allTabs.filter((tab) => permissions.includes(tab.permId))
    : allTabs;

  // Redirect if current sub-tab is not permitted
  useEffect(() => {
    if (!permissions) return;
    const currentPermId = SUB_TAB_MAP[pathname];
    if (currentPermId && !permissions.includes(currentPermId)) {
      // Find the first allowed tab
      const firstAllowed = allTabs.find((tab) =>
        permissions.includes(tab.permId),
      );
      if (firstAllowed) {
        router.replace(firstAllowed.href);
      }
    }
  }, [permissions, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {t("admin.settings.title")}
      </h1>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/admin/settings"
                ? pathname === "/admin/settings"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
