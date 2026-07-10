"use client";

import { useState } from "react";
import { FileBarChart, RefreshCw, Download } from "lucide-react";
import { calculateMonthlyReport, saveReportMetadata, getDailyMonthlyReport } from "@/lib/reports";
import { exportMonthlyReport } from "@/lib/excel";
import { exportDailyMonthlyReport } from "@/lib/exportSnapshot";
import { createClient } from "@/lib/supabase";
import { useBranch } from "@/context/BranchContext";
import type { MonthlyReportRow } from "@/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<MonthlyReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedBranch } = useBranch();

  async function handleGenerate() {
    if (!selectedBranch) { setError("Please select a branch first."); return; }
    setLoading(true);
    setError(null);
    setGenerated(false);
    try {
      const data = await calculateMonthlyReport(month, year, selectedBranch.id);
      setRows(data);
      setGenerated(true);

      // Save metadata — get current user id
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveReportMetadata(month, year, selectedBranch.id, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  const totalReceived = rows.reduce((s, r) => s + r.received, 0);
  const totalUsed = rows.reduce((s, r) => s + r.used_sold, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Denso inventory report — Initial Inventory · Received · Used/Sold · Final Inventory
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          {/* Month */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={selectClass}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={selectClass}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating…" : "Generate Report"}
          </button>

          {generated && rows.length > 0 && (
            <>
              <button
                onClick={() => exportMonthlyReport(rows, month, year)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Summary
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const dailyData = await getDailyMonthlyReport(month, year, selectedBranch!.id);
                    await exportDailyMonthlyReport(dailyData, month, year);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to export daily report.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Daily Report
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Report Table */}
      {generated && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Report Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {MONTHS[month - 1]} {year} — Denso Inventory Report
              </span>
            </div>
            <span className="text-xs text-gray-400">{rows.length} part{rows.length !== 1 ? "s" : ""}</span>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <FileBarChart className="w-8 h-8 opacity-30" />
              <p className="text-sm">No inventory activity for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Part #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Product Name</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Initial Inventory</th>
                    <th className="text-right px-4 py-3 font-medium text-blue-600">Received</th>
                    <th className="text-right px-4 py-3 font-medium text-orange-600">Used / Sold</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Final Inventory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row) => (
                    <tr key={row.part_number} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {row.part_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.product_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.beginning}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">
                        {row.received > 0 ? `+${row.received}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-orange-600">
                        {row.used_sold > 0 ? `-${row.used_sold}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {row.ending}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals */}
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">
                      Total Movement
                    </td>
                    <td className="px-4 py-3 text-right" />
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      +{totalReceived}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">
                      -{totalUsed}
                    </td>
                    <td className="px-4 py-3 text-right" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const selectClass =
  "px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
