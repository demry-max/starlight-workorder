import { redirect } from "next/navigation";

export default function OldUsersPage() {
  redirect("/admin/settings/users");
}
