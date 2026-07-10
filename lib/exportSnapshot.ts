import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";
import type { Part } from "@/types";
import type { DailyReportData } from "./reports";

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

export async function exportDailyMonthlyReport(
  data: DailyReportData[],
  month: number,
  year: number
): Promise<void> {
  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
  });
  const daysInMonth = new Date(year, month, 0).getDate();

  // Color palette for different parts - matching the spreadsheet style
  const colors = [
    "C6E0B4", // Light green
    "A9D08E", // Medium green
    "70AD47", // Dark green
    "92D050", // Lime green
    "C5E0B4", // Very light green
    "A6D96A", // Apple green
    "9DC3E6", // Light blue-green
    "BDD7EE", // Light cyan
  ];

  // Create workbook
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${monthName} ${year}`);

  // Title rows
  ws.mergeCells("A1:AN1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `INVENTORY ${monthName.toUpperCase()}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Build header: PRODUCT, PART NUMBER, PART NAME, APPLICATION, PRICE, LOT SIZE, then Day 1 (IN/OUT), Day 2 (IN/OUT), etc
  const headerData = [
    "PRODUCT",
    "PART NUMBER",
    "PART NAME",
    "APPLICATION",
    "PRICE",
    "LOT SIZE",
  ];

  // Add day headers with IN/OUT sub-columns
  for (let day = 1; day <= daysInMonth; day++) {
    headerData.push(`${day}`);
    headerData.push("");
  }
  headerData.push("TOTAL IN");
  headerData.push("TOTAL OUT");
  headerData.push("TOTAL SALE");

  const headerRow = ws.addRow(headerData);

  // Style header - dark blue
  headerRow.eachCell((cell, colNum) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  });

  // Merge cells for each day (columns 7-onwards, every 2 columns)
  let colIndex = 7; // Start after UBE-NUM (column 6)
  for (let day = 1; day <= daysInMonth; day++) {
    const startCol = XLSX.utils.encode_col(colIndex - 1);
    const endCol = XLSX.utils.encode_col(colIndex);
    ws.mergeCells(`${startCol}2:${endCol}2`);
    colIndex += 2;
  }

  // Add sub-header row for IN/OUT - yellow background
  const subHeaderData = [
    "PRODUCT",
    "PART NUMBER",
    "PART NAME",
    "APPLICATION",
    "PRICE",
    "LOT SIZE",
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    subHeaderData.push("IN");
    subHeaderData.push("OUT");
  }
  subHeaderData.push("");
  subHeaderData.push("");
  subHeaderData.push("");

  const subHeaderRow = ws.addRow(subHeaderData);

  // Style sub-header - yellow
  subHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFE699" },
    };
    cell.font = { bold: true, color: { argb: "FF000000" }, size: 9 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  });

  // Group by product category
  const grouped = new Map<string, DailyReportData[]>();
  for (const item of data) {
    const category = item.productCategory || "UNCATEGORIZED";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(item);
  }

  let partIndex = 0;

  // Add data rows
  let totalSalesAllMonth = 0;
  for (const [category, items] of grouped) {
    // Category header row - dark blue
    const categoryRow = ws.addRow([category]);
    categoryRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    for (const item of items) {
      const color = colors[partIndex % colors.length];
      const fillColor = { argb: `FF${color}` };

      // Build row with IN/OUT for each day
      const rowData = [
        "",
        item.partNumber,
        item.productName,
        item.application,
        item.price,
        "",
      ];

      // Add IN/OUT for each day
      for (let i = 0; i < daysInMonth; i++) {
        rowData.push(item.dailyIn[i] || 0);
        rowData.push(item.dailyOut[i] || 0);
      }

      const totalSaleForPart = item.totalOut * item.price;
      totalSalesAllMonth += totalSaleForPart;
      rowData.push(item.totalIn, item.totalOut, totalSaleForPart);

      const dataRow = ws.addRow(rowData);
      dataRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: fillColor };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          left: { style: "thin" },
          right: { style: "thin" },
          top: { style: "thin" },
          bottom: { style: "thin" },
        };
      });

      partIndex++;
    }
  }

  // Add total sales row
  ws.addRow([]); // Empty row for spacing
  const totalSalesRowData = Array(6 + daysInMonth * 2 + 3).fill(""); // Fill with empty for all columns
  totalSalesRowData[0] = "TOTAL SALES FOR THE MONTH";
  totalSalesRowData[6 + daysInMonth * 2 + 2] = totalSalesAllMonth; // Last column

  const totalSalesRow = ws.addRow(totalSalesRowData);
  
  // Merge cells for the label (columns A to C)
  ws.mergeCells(`A${totalSalesRow.number}:C${totalSalesRow.number}`);
  
  totalSalesRow.eachCell((cell, colNum) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF79646" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
  });

  // Set column widths
  const columns: Partial<ExcelJS.Column>[] = [
    { width: 12 }, // PRODUCT
    { width: 14 }, // PART NUMBER
    { width: 18 }, // PART NAME
    { width: 18 }, // APPLICATION
    { width: 8 },  // PRICE
    { width: 8 },  // LOT SIZE
  ];

  // Add width for each day (IN/OUT pair)
  for (let i = 0; i < daysInMonth; i++) {
    columns.push({ width: 5 }); // IN
    columns.push({ width: 5 }); // OUT
  }

  columns.push({ width: 9 }); // TOTAL IN
  columns.push({ width: 9 }); // TOTAL OUT
  columns.push({ width: 12 }); // TOTAL SALE

  ws.columns = columns;

  // Write file
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Romeros_Monthly_Report_${monthName}_${year}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
