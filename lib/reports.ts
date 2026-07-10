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

export interface DailyReportData {
  productName: string;
  partNumber: string;
  productCategory: string;
  application: string;
  price: number;
  dailyIn: number[]; // 31 days
  dailyOut: number[]; // 31 days
  totalIn: number;
  totalOut: number;
}

export async function getDailyMonthlyReport(
  month: number,
  year: number,
  branchId: string
): Promise<DailyReportData[]> {
  const supabase = createClient();

  const monthStr = String(month).padStart(2, "0");
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${monthStr}-01`;

  // Get all movements for the month
  const { data: movements } = await supabase
    .from("stock_movements")
    .select("part_id, type, quantity, date")
    .eq("branch_id", branchId)
    .gte("date", startDate)
    .lt("date", `${year}-${String(month + 1).padStart(2, "0")}-01`);

  // Get all parts
  const { data: parts } = await supabase
    .from("parts")
    .select("id, part_number, product_name, category, vehicle_compatibility, selling_price")
    .eq("branch_id", branchId)
    .order("product_name");

  if (!parts) return [];

  const result: DailyReportData[] = [];

  for (const part of parts) {
    const dailyIn = new Array(31).fill(0);
    const dailyOut = new Array(31).fill(0);

    // Process movements for this part
    for (const m of movements ?? []) {
      if (m.part_id === part.id) {
        const day = parseInt(m.date.split("-")[2]) - 1; // 0-indexed
        if (day >= 0 && day < daysInMonth) {
          if (m.type === "IN") {
            dailyIn[day] += m.quantity;
          } else {
            dailyOut[day] += m.quantity;
          }
        }
      }
    }

    const totalIn = dailyIn.reduce((a, b) => a + b, 0);
    const totalOut = dailyOut.reduce((a, b) => a + b, 0);

    // Only include parts with activity
    if (totalIn > 0 || totalOut > 0) {
      result.push({
        productName: part.product_name,
        partNumber: part.part_number,
        productCategory: part.category,
        application: part.vehicle_compatibility || "",
        price: part.selling_price,
        dailyIn,
        dailyOut,
        totalIn,
        totalOut,
      });
    }
  }

  return result;
}
