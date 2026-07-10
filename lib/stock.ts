import { createClient } from "./supabase";
import type { Part, StockMovement, UserProfile } from "@/types";

export interface StockInInput {
  part_id: string;
  branch_id: string;
  quantity: number;
  supplier: string;
  reference: string;
  remarks: string;
  date: string;
}

export interface StockOutInput {
  part_id: string;
  branch_id: string;
  quantity: number;
  reference: string;
  remarks: string;
  date: string;
}

export interface StockOutMultipleInput {
  lineItems: Array<{
    id: string;
    part_id: string;
    quantity: number;
  }>;
  branch_id: string;
  reference: string;
  remarks: string;
  date: string;
}

export type MovementWithPart = StockMovement & {
  parts: Pick<Part, "part_number" | "product_name"> | null;
  user: Pick<UserProfile, "id" | "first_name" | "last_name"> | null;
};

async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function insertStockIn(data: StockInInput): Promise<void> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("stock_movements").insert({
    ...data,
    type: "IN",
    user_id: userId,
  });
  if (error) throw error;
}

export async function insertStockOut(data: StockOutInput): Promise<void> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("stock_movements").insert({
    ...data,
    type: "OUT",
    user_id: userId,
  });
  if (error) throw error;
}

export async function insertStockOutMultiple(data: StockOutMultipleInput): Promise<void> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  // Create an entry for each line item
  const records = data.lineItems.map((item) => ({
    part_id: item.part_id,
    branch_id: data.branch_id,
    quantity: item.quantity,
    reference: data.reference,
    remarks: data.remarks,
    date: data.date,
    type: "OUT" as const,
    user_id: userId,
  }));

  const { error } = await supabase.from("stock_movements").insert(records);
  if (error) throw error;
}

export async function getMovements(
  branchId: string,
  type?: "IN" | "OUT"
): Promise<MovementWithPart[]> {
  const supabase = createClient();
  let query = supabase
    .from("stock_movements")
    .select("*, parts(part_number, product_name), user:profiles(id, first_name, last_name)")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MovementWithPart[];
}

export interface HistoryFilters {
  type?: "IN" | "OUT";
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  search?: string;
  page?: number; // 0-based
  pageSize?: number;
}

export interface HistoryResult {
  data: MovementWithPart[];
  total: number;
}

export async function getHistory(
  branchId: string,
  filters: HistoryFilters = {}
): Promise<HistoryResult> {
  const { type, from, to, search, page = 0, pageSize = 50 } = filters;
  const supabase = createClient();

  let query = supabase
    .from("stock_movements")
    .select(
      "*, parts(part_number, product_name), user:profiles(id, first_name, last_name)",
      { count: "exact" }
    )
    .eq("branch_id", branchId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (type) query = query.eq("type", type);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error, count } = await query;
  if (error) throw error;

  let rows = (data ?? []) as MovementWithPart[];
  
  // Debug logging
  if (rows.length > 0) {
    console.log("Debug: First row structure:", {
      id: rows[0].id,
      user_id: rows[0].user_id,
      user: rows[0].user,
      parts: rows[0].parts,
    });
  }

  // Client-side search on part name/number (Supabase can't filter on joined columns)
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (m) =>
        m.parts?.product_name.toLowerCase().includes(q) ||
        m.parts?.part_number.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q) ||
        m.remarks.toLowerCase().includes(q) ||
        `${m.user?.first_name} ${m.user?.last_name}`.toLowerCase().includes(q)
    );
  }

  return { data: rows, total: count ?? 0 };
}
