"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import StatCard from "@/components/StatCard";
import {
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Clock,
  BarChart3,
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
  const [currentTime, setCurrentTime] = useState("");

  const load = useCallback(async () => {
    if (!selectedBranch) return;
    const result = await getDashboardData(selectedBranch.id);
    setData(result);
  }, [selectedBranch]);

  useEffect(() => {
    load();
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    return () => clearInterval(timer);
  }, [load]);

  const { totalParts, lowStockCount, lowStockParts, recentIn, recentOut } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
              <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-white rounded-full border border-gray-200">
                {selectedBranch?.name || "No branch selected"}
              </span>
            </div>
            <p className="text-gray-600">Monitor your inventory and stock movements at a glance</p>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Parts"
            value={totalParts}
            icon={Package}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            description="Active products"
            trend={12}
          />
          <StatCard
            title="Low Stock Alert"
            value={lowStockCount}
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBg="bg-red-50"
            description="Needs attention"
            alert={lowStockCount > 0}
            trend={lowStockCount > 0 ? 5 : -10}
          />
          <StatCard
            title="Stock Inbound"
            value={recentIn.length}
            icon={ArrowDownCircle}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            description="Recent deliveries"
            trend={8}
          />
          <StatCard
            title="Stock Outbound"
            value={recentOut.length}
            icon={ArrowUpCircle}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            description="Recent shipments"
            trend={-3}
          />
        </div>

        {/* Low Stock Alert Section */}
        {lowStockParts.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-red-900">Low Stock Alert</h2>
                  <p className="text-xs text-red-700">Requires immediate attention</p>
                </div>
              </div>
              <span className="text-sm font-bold text-white bg-red-600 px-3 py-1 rounded-full">
                {lowStockParts.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {lowStockParts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-red-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.product_name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{p.part_number}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{p.category}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-lg font-bold text-red-600">{p.stock}</p>
                    <p className="text-xs text-gray-500">Min: {p.min_stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock In */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Stock Inbound</h2>
              <p className="text-xs text-gray-600">Recent deliveries</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentIn.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No inbound stock yet</p>
              </div>
            ) : (
              recentIn.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{m.parts?.product_name || "Unknown"}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">{m.parts?.part_number || "N/A"}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{m.date}</span>
                    </div>
                  </div>
                  <span className="ml-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 font-bold text-sm shrink-0">
                    +{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Out */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Stock Outbound</h2>
              <p className="text-xs text-gray-600">Recent shipments</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOut.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No outbound stock yet</p>
              </div>
            ) : (
              recentOut.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{m.parts?.product_name || "Unknown"}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">{m.parts?.part_number || "N/A"}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{m.date}</span>
                    </div>
                  </div>
                  <span className="ml-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-600 font-bold text-sm shrink-0">
                    -{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="/stock?tab=in"
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-4 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <span className="font-medium">Stock In</span>
            </div>
            <p className="text-xs text-white/80 mt-1">Record new delivery</p>
          </a>
          <a
            href="/stock?tab=out"
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <span className="font-medium">Stock Out</span>
            </div>
            <p className="text-xs text-white/80 mt-1">Record usage/sale</p>
          </a>
          <a
            href="/parts?action=add"
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-medium">Add Part</span>
            </div>
            <p className="text-xs text-white/80 mt-1">New product</p>
          </a>
          <a
            href="/reports"
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white p-4 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-medium">Reports</span>
            </div>
            <p className="text-xs text-white/80 mt-1">View analytics</p>
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
