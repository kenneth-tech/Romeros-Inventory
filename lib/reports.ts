import { createClient } from "./supabase";
import type { MonthlyReportRow } from "@/types";

/**
 * Calculates the Denso monthly inventory report for a given month/year.
 *
 * Formula:
 *   Ending    = current stock + (OUT after month) - (IN after month)
 *   Beginning = Ending - Received + Used/Sold
 *
 * This is accurate for any month as long as all movements are recorded.
 */
export async function calculateMonthlyReport(
  month: number,
  year: number,
  branchId: string
): Promise<MonthlyReportRow[]> {
  const supabase = createClient();

  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  // Last day of the month
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  // First day of next month (exclusive lower bound for future movements)
  const afterDate = new Date(year, month, 1).toISOString().split("T")[0];

  const [
    { data: monthMovements },
    { data: futureMovements },
    { data: parts },
  ] = await Promise.all([
    // All movements in the month for this branch
    supabase
      .from("stock_movements")
      .select("part_id, type, quantity")
      .eq("branch_id", branchId)
      .gte("date", startDate)
      .lte("date", endDate),
    // All movements after the month for this branch
    supabase
      .from("stock_movements")
      .select("part_id, type, quantity")
      .eq("branch_id", branchId)
      .gte("date", afterDate),
    // All parts for this branch with current stock
    supabase
      .from("parts")
      .select("id, part_number, product_name, stock")
      .eq("branch_id", branchId)
      .order("product_name"),
  ]);

  if (!parts) return [];

  // Build a map of future net movement per part: positive = net IN after month
  const futureNet = new Map<string, number>();
  for (const m of futureMovements ?? []) {
    const current = futureNet.get(m.part_id) ?? 0;
    futureNet.set(
      m.part_id,
      m.type === "IN" ? current + m.quantity : current - m.quantity
    );
  }

  // Build a map of received + used per part for the month
  const received = new Map<string, number>();
  const usedSold = new Map<string, number>();
  for (const m of monthMovements ?? []) {
    if (m.type === "IN") {
      received.set(m.part_id, (received.get(m.part_id) ?? 0) + m.quantity);
    } else {
      usedSold.set(m.part_id, (usedSold.get(m.part_id) ?? 0) + m.quantity);
    }
  }

  // Collect all part IDs that had activity in the month
  const activeIds = new Set([...received.keys(), ...usedSold.keys()]);

  const rows: MonthlyReportRow[] = [];

  for (const part of parts) {
    const rec = received.get(part.id) ?? 0;
    const used = usedSold.get(part.id) ?? 0;
    const netFuture = futureNet.get(part.id) ?? 0;

    // ending = current stock minus net future movements
    const ending = part.stock - netFuture;
    const beginning = ending - rec + used;

    // Only include parts with activity OR non-zero beginning stock
    if (!activeIds.has(part.id) && beginning === 0 && ending === 0) continue;

    rows.push({
      part_number: part.part_number,
      product_name: part.product_name,
      beginning: Math.max(0, beginning),
      received: rec,
      used_sold: used,
      ending: Math.max(0, ending),
    });
  }

  return rows;
}

export async function saveReportMetadata(
  month: number,
  year: number,
  branchId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("monthly_reports")
    .upsert(
      { month, year, branch_id: branchId, generated_by: userId },
      { onConflict: "month,year,branch_id" }
    );
}
