"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { getHistory, type MovementWithPart } from "@/lib/stock";
import { useBranch } from "@/context/BranchContext";
import TypeFilter from "@/components/TypeFilter";
import LoadingSpinner from "@/components/LoadingSpinner";

const PAGE_SIZE = 50;

const inputClass =
  "px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function HistoryPage() {
  const { selectedBranch } = useBranch();

  const [rows, setRows] = useState<MovementWithPart[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"" | "IN" | "OUT">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHistory(selectedBranch.id, {
        type: typeFilter || undefined,
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(result.data);
      setTotal(result.total);
      // Ensure spinner shows for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, typeFilter, from, to, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedBranch, typeFilter, from, to, search]);

  return (
    <>
      {loading && <LoadingSpinner />}
      <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {selectedBranch
            ? `All stock movements — ${selectedBranch.name}`
            : "Select a branch from the sidebar"}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part, reference, remarks…"
              className={inputClass + " w-full pl-9"}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            {/* Type */}
            <div className="flex items-center gap-1.5">
              <TypeFilter selectedType={typeFilter} onChange={setTypeFilter} />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">From</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">To</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Clear */}
            {(typeFilter || from || to || search) && (
              <button
                onClick={() => {
                  setTypeFilter("");
                  setFrom("");
                  setTo("");
                  setSearch("");
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Part #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No transactions found</p>
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {m.date} {m.created_at ? new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {m.type === "IN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <ArrowDownCircle className="w-3 h-3" />
                          Stock In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                          <ArrowUpCircle className="w-3 h-3" />
                          Stock Out
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {m.user?.first_name || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {m.parts?.part_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {m.parts?.product_name ?? "—"}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${m.type === "IN" ? "text-green-600" : "text-orange-600"}`}>
                      {m.type === "IN" ? "+" : "-"}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-32 truncate">
                      {m.reference || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-40 truncate">
                      {m.remarks || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} transactions
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
