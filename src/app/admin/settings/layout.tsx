"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/context";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { href: "/admin/settings", label: t("admin.settings.tabs.smtp") },
    { href: "/admin/settings/statuses", label: t("admin.settings.tabs.statuses") },
    { href: "/admin/settings/users", label: t("admin.settings.tabs.users") },
    { href: "/admin/settings/sales-reps", label: t("admin.settings.tabs.salesReps") },
  ];

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
