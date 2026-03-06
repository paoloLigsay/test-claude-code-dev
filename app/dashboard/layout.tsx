import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rootFolders } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .is("parent_id", null)
    .order("name");

  return <DashboardShell initialFolders={rootFolders ?? []} />;
}
