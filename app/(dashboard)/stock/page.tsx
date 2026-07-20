"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import StockInForm from "@/components/StockInForm";
import StockOutForm from "@/components/StockOutForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getMovements, type MovementWithPart } from "@/lib/stock";
import { getParts } from "@/lib/parts";
import { useBranch } from "@/context/BranchContext";
import type { Part } from "@/types";

type Tab = "in" | "out";

export default function StockPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedBranch } = useBranch();

  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "out" ? "out" : "in"
  );
  const [parts, setParts] = useState<Part[]>([]);
  const [movements, setMovements] = useState<MovementWithPart[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [loadingParts, setLoadingParts] = useState(true);

  const loadMovements = useCallback(async (type: Tab) => {
    if (!selectedBranch) return;
    setLoadingMovements(true);
    try {
      const data = await getMovements(selectedBranch.id, type === "in" ? "IN" : "OUT");
      setMovements(data);
    } finally {
      setLoadingMovements(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      setLoadingParts(true);
      getParts(selectedBranch.id).then(setParts).catch(console.error).finally(() => setLoadingParts(false));
    }
  }, [selectedBranch]);

  useEffect(() => {
    loadMovements(tab);
  }, [tab, loadMovements]);

  function switchTab(t: Tab) {
    setTab(t);
    router.replace(`/stock?tab=${t}`);
  }

  return (
    <>
      {(loadingMovements || loadingParts) && <LoadingSpinner />}
      <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movement</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {selectedBranch ? selectedBranch.name : "Select a branch from the sidebar"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => switchTab("in")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "in"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Stock In
        </button>
        <button
          onClick={() => switchTab("out")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "out"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Stock Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {tab === "in" ? "New Delivery / Stock In" : "Usage / Sale / Stock Out"}
          </h2>
          {tab === "in" ? (
            <StockInForm
              parts={parts}
              branchId={selectedBranch?.id ?? ""}
              onSuccess={() => loadMovements("in")}
            />
          ) : (
            <StockOutForm
              parts={parts}
              branchId={selectedBranch?.id ?? ""}
              onSuccess={() => loadMovements("out")}
            />
          )}
        </div>

        {/* Movement History */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              {tab === "in" ? "Recent Stock In" : "Recent Stock Out"}
            </h2>
          </div>
          {loadingMovements ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No records yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {movements.map((m) => (
                <div key={m.id} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.parts?.product_name ?? "Unknown Part"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.parts?.part_number}
                      {m.reference ? ` · ${m.reference}` : ""}
                    </p>
                    {m.remarks && (
                      <p className="text-xs text-gray-400 truncate">{m.remarks}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tab === "in" ? "text-green-600" : "text-orange-600"}`}>
                      {tab === "in" ? "+" : "-"}{m.quantity}
                    </p>
                    <p className="text-xs text-gray-400">{m.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
