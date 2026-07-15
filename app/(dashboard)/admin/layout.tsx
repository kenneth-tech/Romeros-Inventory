import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const profile = await getUserProfile();
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
