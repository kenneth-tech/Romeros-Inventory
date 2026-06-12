import { createClient } from "./supabase-server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateUserProfile(profileData: {
  name: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ name: profileData.name })
    .eq("id", user.id);

  if (error) throw error;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
