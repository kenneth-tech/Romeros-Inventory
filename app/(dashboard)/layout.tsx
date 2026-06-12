import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import { BranchProvider } from "@/context/BranchContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <BranchProvider>
      <DashboardShell>{children}</DashboardShell>
    </BranchProvider>
  );
}
