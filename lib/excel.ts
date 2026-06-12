import * as XLSX from "xlsx";
import type { MonthlyReportRow } from "@/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function exportMonthlyReport(
  rows: MonthlyReportRow[],
  month: number,
  year: number
): void {
  const wb = XLSX.utils.book_new();

  const totalReceived = rows.reduce((s, r) => s + r.received, 0);
  const totalUsed = rows.reduce((s, r) => s + r.used_sold, 0);

  const data: (string | number)[][] = [
    ["DENSO MONTHLY INVENTORY REPORT"],
    [`${MONTHS[month - 1].toUpperCase()} ${year}`],
    ["Romeros Car Aircon"],
    [],
    ["Part Number", "Product Name", "Beginning", "Received", "Used / Sold", "Ending"],
    ...rows.map((r) => [
      r.part_number,
      r.product_name,
      r.beginning,
      r.received,
      r.used_sold,
      r.ending,
    ]),
    [],
    ["", "TOTAL", "", totalReceived, totalUsed, ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 15 }, // Part Number
    { wch: 32 }, // Product Name
    { wch: 12 }, // Beginning
    { wch: 12 }, // Received
    { wch: 12 }, // Used / Sold
    { wch: 12 }, // Ending
  ];

  // Merge title cells A1:F1 and A2:F2
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
  XLSX.writeFile(wb, `Denso_Report_${MONTHS[month - 1]}_${year}.xlsx`);
}
