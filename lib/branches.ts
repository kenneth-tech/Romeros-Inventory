import { createClient } from "./supabase";
import type { Branch } from "@/types";

export type BranchInput = Pick<Branch, "name" | "address">;

export async function getBranches(): Promise<Branch[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Branch[];
}

export async function addBranch(input: BranchInput): Promise<Branch> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function updateBranch(
  id: string,
  input: Partial<BranchInput>
): Promise<Branch> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function deleteBranch(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) throw error;
}
