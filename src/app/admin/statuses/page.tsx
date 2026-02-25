import { redirect } from "next/navigation";

export default function OldStatusesPage() {
  redirect("/admin/settings/statuses");
}
