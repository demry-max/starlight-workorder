import { StaffRole } from "@prisma/client";
import { prisma } from "./prisma";

export type RolePermissions = Record<string, string[]>;

export const ALL_TAB_IDS = [
  "dashboard",
  "workorders",
  "ratings",
  "logs",
  "guide",
  "settings",
  "settings.smtp",
  "settings.statuses",
  "settings.users",
  "settings.salesReps",
] as const;

export type TabId = (typeof ALL_TAB_IDS)[number];

export const DEFAULT_PERMISSIONS: RolePermissions = {
  ADMIN: [...ALL_TAB_IDS],
  MANAGER: [
    "dashboard",
    "workorders",
    "ratings",
    "logs",
    "guide",
    "settings",
    "settings.smtp",
    "settings.statuses",
    "settings.salesReps",
  ],
  STAFF: ["dashboard", "workorders", "ratings"],
};

const SETTING_KEY = "role_permissions";

export async function getPermissions(): Promise<RolePermissions> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (setting) {
      const stored = JSON.parse(setting.value) as RolePermissions;
      // Merge any newly added tab IDs into stored permissions
      // so that new tabs automatically appear for roles that should have them
      const allIds = ALL_TAB_IDS as readonly string[];
      for (const [role, defaultPerms] of Object.entries(DEFAULT_PERMISSIONS)) {
        const storedPerms = stored[role] || [];
        const newTabs = defaultPerms.filter(
          (tab) => allIds.includes(tab) && !storedPerms.includes(tab),
        );
        if (newTabs.length > 0) {
          stored[role] = [...storedPerms, ...newTabs];
        }
      }
      return stored;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_PERMISSIONS;
}

export async function savePermissions(
  permissions: RolePermissions,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(permissions) },
    update: { value: JSON.stringify(permissions) },
  });
}

export function hasPermission(
  permissions: RolePermissions,
  role: StaffRole,
  tabId: string,
): boolean {
  const rolePerms = permissions[role];
  if (!rolePerms) return false;
  return rolePerms.includes(tabId);
}
