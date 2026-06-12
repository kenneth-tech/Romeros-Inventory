"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import StatCard from "@/components/StatCard";
import {
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  FileBarChart,
} from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import { type StockMovement, type Part } from "@/types";

type MovementWithPart = StockMovement & {
  parts: Pick<Part, "part_number" | "product_name"> | null;
};

type LowStockPart = Pick<Part, "id" | "part_number" | "product_name" | "category" | "stock" | "min_stock">;

interface DashboardData {
  totalParts: number;
  lowStockCount: number;
  lowStockParts: LowStockPart[];
  recentIn: MovementWithPart[];
  recentOut: MovementWithPart[];
}

async function getDashboardData(branchId: string): Promise<DashboardData> {
  const supabase = createClient();

  const [
    { count: totalParts },
    { data: allParts },
    { data: recentIn },
    { data: recentOut },
  ] = await Promise.all([
    supabase.from("parts").select("*", { count: "exact", head: true }).eq("branch_id", branchId),
    supabase.from("parts").select("id, part_number, product_name, category, stock, min_stock").eq("branch_id", branchId),
    supabase
      .from("stock_movements")
      .select("*, parts(part_number, product_name)")
      .eq("branch_id", branchId)
      .eq("type", "IN")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("stock_movements")
      .select("*, parts(part_number, product_name)")
      .eq("branch_id", branchId)
      .eq("type", "OUT")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const lowStockParts = (allParts ?? []).filter((p) => p.stock <= p.min_stock) as LowStockPart[];

  return {
    totalParts: totalParts ?? 0,
    lowStockCount: lowStockParts.length,
    lowStockParts,
    recentIn: (recentIn ?? []) as MovementWithPart[],
    recentOut: (recentOut ?? []) as MovementWithPart[],
  };
}

export default function DashboardPage() {
  const { selectedBranch } = useBranch();
  const [data, setData] = useState<DashboardData>({
    totalParts: 0,
    lowStockCount: 0,
    lowStockParts: [],
    recentIn: [],
    recentOut: [],
  });

  const load = useCallback(async () => {
    if (!selectedBranch) return;
    const result = await getDashboardData(selectedBranch.id);
    setData(result);
  }, [selectedBranch]);

  useEffect(() => {
    load();
  }, [load]);

  const { totalParts, lowStockCount, lowStockParts, recentIn, recentOut } = data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {selectedBranch ? selectedBranch.name : "Select a branch from the sidebar"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Parts"
          value={totalParts}
          icon={Package}
          description="All Denso products in catalogue"
        />
        <StatCard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          description="Parts at or below minimum"
          alert={lowStockCount > 0}
        />
        <StatCard
          title="Recent Stock In"
          value={recentIn.length}
          icon={ArrowDownCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          description="Last 5 deliveries"
        />
        <StatCard
          title="Recent Stock Out"
          value={recentOut.length}
          icon={ArrowUpCircle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          description="Last 5 usages / sales"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-700">Low Stock Alert</h2>
            <span className="ml-auto text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              {lowStockParts.length} part{lowStockParts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-red-50">
            {lowStockParts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-red-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {p.product_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.part_number} · {p.category}
                  </p>
                </div>
                <div className="ml-3 text-right shrink-0">
                  <p className="text-sm font-bold text-red-600">Stock: {p.stock}</p>
                  <p className="text-xs text-gray-400">Min: {p.min_stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock In */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <ArrowDownCircle className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Stock In</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentIn.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No stock in records yet
              </p>
            ) : (
              recentIn.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.parts?.product_name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {m.parts?.part_number} · {m.date}
                    </p>
                  </div>
                  <span className="ml-3 text-sm font-semibold text-green-600 shrink-0">
                    +{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Out */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <ArrowUpCircle className="w-4 h-4 text-orange-600" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Stock Out</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOut.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No stock out records yet
              </p>
            ) : (
              recentOut.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.parts?.product_name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {m.parts?.part_number} · {m.date}
                    </p>
                  </div>
                  <span className="ml-3 text-sm font-semibold text-orange-600 shrink-0">
                    -{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/parts?action=add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Package className="w-4 h-4" />
            Add Part
          </a>
          <a
            href="/stock?tab=in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Stock In
          </a>
          <a
            href="/stock?tab=out"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Stock Out
          </a>
          <a
            href="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <FileBarChart className="w-4 h-4" />
            Generate Report
          </a>
        </div>
      </div>
    </div>
  );
}
