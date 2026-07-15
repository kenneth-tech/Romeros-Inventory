import { createClient } from "./supabase";

export interface UserWithBranches {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "staff";
  branches: Array<{ id: string; name: string }>;
}

/**
 * Get all users with their branch assignments (admin only)
 */
export async function getAllUsersWithBranches(): Promise<UserWithBranches[]> {
  const supabase = createClient();

  // First, get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role");

  if (profilesError) throw profilesError;

  // Then get all user emails from auth (this requires proper RLS setup)
  const users: UserWithBranches[] = [];

  for (const profile of profiles || []) {
    // Get branches for this user
    const { data: userBranches } = await supabase
      .from("user_branches")
      .select("branches(id, name)")
      .eq("user_id", profile.id);

    users.push({
      id: profile.id,
      email: "", // Will be populated if we can access auth.users
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      branches: userBranches?.map((ub: any) => ub.branches) || [],
    });
  }

  return users;
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  role: "admin" | "staff"
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Update user's name (admin or user themselves)
 */
export async function updateUserName(
  userId: string,
  firstName: string,
  lastName: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Assign branches to a user
 */
export async function assignBranchesToUser(
  userId: string,
  branchIds: string[]
): Promise<void> {
  const supabase = createClient();

  // Delete existing assignments
  await supabase.from("user_branches").delete().eq("user_id", userId);

  // Insert new assignments
  if (branchIds.length > 0) {
    const { error } = await supabase.from("user_branches").insert(
      branchIds.map((branchId) => ({
        user_id: userId,
        branch_id: branchId,
      }))
    );

    if (error) throw error;
  }
}

/**
 * Get branches assigned to current user
 */
export async function getUserBranches(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    console.error("Session error:", sessionError);
    throw new Error("Not authenticated");
  }

  // First get the branch IDs for this user from user_branches
  const { data: userBranchData, error: userBranchError } = await supabase
    .from("user_branches")
    .select("branch_id")
    .eq("user_id", session.user.id);

  if (userBranchError) {
    console.error("User branches query error:", userBranchError);
    throw userBranchError;
  }

  console.log("User branch data:", userBranchData);

  const branchIds = userBranchData?.map((item: any) => item.branch_id) || [];

  if (branchIds.length === 0) {
    console.log("No branches found for user:", session.user.id);
    return [];
  }

  // Then get the branch details from the branches table
  const { data: branchesData, error: branchesError } = await supabase
    .from("branches")
    .select("id, name")
    .in("id", branchIds);

  if (branchesError) {
    console.error("Branches query error:", branchesError);
    throw branchesError;
  }

  console.log("Branches data:", branchesData);
  return branchesData || [];
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = createClient();

  // This only deletes from profiles; the auth user deletion would need to be handled
  // through Supabase admin API (which requires a backend/server endpoint)
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) throw error;
}
