import { createClient } from "./supabase";
import type { Part } from "@/types";

export type PartInput = Omit<Part, "id" | "created_at" | "branch_id">;

export async function getParts(branchId: string): Promise<Part[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("parts")
    .select("*")
    .eq("branch_id", branchId)
    .order("product_name");
  if (error) throw error;
  return data as Part[];
}

export async function addPart(part: PartInput & { branch_id: string }): Promise<Part> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("parts")
    .insert(part)
    .select()
    .single();
  if (error) throw error;
  return data as Part;
}

export async function updatePart(
  id: string,
  part: Partial<PartInput>
): Promise<Part> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("parts")
    .update(part)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Part;
}

export async function deletePart(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("parts").delete().eq("id", id);
  if (error) throw error;
}
