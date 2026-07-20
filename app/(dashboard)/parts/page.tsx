"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import PartModal from "@/components/PartModal";
import CategoryFilter from "@/components/CategoryFilter";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getParts,
  addPart,
  updatePart,
  deletePart,
  type PartInput,
} from "@/lib/parts";
import { exportInventorySnapshot } from "@/lib/exportSnapshot";
import { useBranch } from "@/context/BranchContext";
import type { Part } from "@/types";

type SortKey = "part_number" | "product_name" | "category" | "vehicle_compatibility" | "stock" | "selling_price";
type SortDir = "asc" | "desc";

export default function PartsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedBranch } = useBranch();

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const load = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getParts(selectedBranch.id);
      setParts(data);
    } catch {
      setError("Failed to load parts.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle ?action=add from dashboard quick action
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setEditingPart(null);
      setModalOpen(true);
      router.replace("/parts");
    }
  }, [searchParams, router]);

  const categories = ["All", ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean))).sort()];

  const filtered = parts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.part_number.toLowerCase().includes(q) ||
      p.product_name.toLowerCase().includes(q) ||
      p.vehicle_compatibility.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
      : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />;
  }

  async function handleSave(data: PartInput) {
    if (editingPart) {
      await updatePart(editingPart.id, data);
    } else {
      await addPart({ ...data, branch_id: selectedBranch!.id });
    }
    await load();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deletePart(id);
      setConfirmDeleteId(null);
      await load();
    } catch {
      setError("Failed to delete part.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {loading && <LoadingSpinner />}
      <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBranch ? (
              <>{parts.length} product{parts.length !== 1 ? "s" : ""} — {selectedBranch.name}</>
            ) : (
              "Select a branch from the sidebar"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportInventorySnapshot(parts)}
            disabled={parts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              setEditingPart(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Part
          </button>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search part number, name, vehicle…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-[200px]">
          <CategoryFilter
            categories={categories}
            selectedCategory={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Loading parts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Package className="w-8 h-8 opacity-40" />
            <p className="text-sm">
              {search || categoryFilter !== "All" ? "No parts match your filters." : "No parts added yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {(
                    [
                      { key: "part_number", label: "Part #", align: "left" },
                      { key: "product_name", label: "Product Name", align: "left" },
                      { key: "category", label: "Category", align: "left" },
                      { key: "vehicle_compatibility", label: "Vehicle", align: "left" },
                      { key: "stock", label: "Stock", align: "right" },
                      { key: "selling_price", label: "Price (₱)", align: "right" },
                    ] as { key: SortKey; label: string; align: "left" | "right" }[]
                  ).map(({ key, label, align }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className={`px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 hover:bg-gray-100 transition-colors text-${align}`}
                    >
                      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
                        {label}
                        <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((part) => {
                  const lowStock = part.stock <= part.min_stock;
                  return (
                    <tr key={part.id} className={`hover:bg-gray-50 transition-colors ${lowStock ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {part.part_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {part.product_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{part.category || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{part.vehicle_compatibility || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold ${lowStock ? "text-red-600" : "text-gray-900"}`}>
                          {lowStock && <AlertTriangle className="w-3 h-3" />}
                          {part.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {part.selling_price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {confirmDeleteId === part.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 mr-1">Delete?</span>
                              <button
                                onClick={() => handleDelete(part.id)}
                                disabled={deleting}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPart(part);
                                  setModalOpen(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(part.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PartModal
        isOpen={modalOpen}
        part={editingPart}
        onClose={() => {
          setModalOpen(false);
          setEditingPart(null);
        }}
        onSave={handleSave}
      />
    </div>
    </>
  );
}
