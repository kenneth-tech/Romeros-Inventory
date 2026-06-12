import * as XLSX from "xlsx";
import type { Part } from "@/types";

export function exportInventorySnapshot(parts: Part[]): void {
  const wb = XLSX.utils.book_new();

  const generated = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const data: (string | number)[][] = [
    ["ROMEROS CAR AIRCON — INVENTORY SNAPSHOT"],
    [`Generated: ${generated}`],
    [],
    [
      "Part Number",
      "Product Name",
      "Category",
      "Vehicle Compatibility",
      "Stock",
      "Min Stock",
      "Cost Price (₱)",
      "Selling Price (₱)",
      "Supplier",
      "Location",
    ],
    ...parts.map((p) => [
      p.part_number,
      p.product_name,
      p.category,
      p.vehicle_compatibility,
      p.stock,
      p.min_stock,
      p.cost_price,
      p.selling_price,
      p.supplier,
      p.location,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 15 }, // Part Number
    { wch: 32 }, // Product Name
    { wch: 15 }, // Category
    { wch: 22 }, // Vehicle Compatibility
    { wch: 8 },  // Stock
    { wch: 8 },  // Min Stock
    { wch: 14 }, // Cost Price
    { wch: 14 }, // Selling Price
    { wch: 22 }, // Supplier
    { wch: 15 }, // Location
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  XLSX.writeFile(
    wb,
    `Romeros_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}
