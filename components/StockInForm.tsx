"use client";

import { useState } from "react";
import { ArrowDownCircle } from "lucide-react";
import { insertStockIn, type StockInInput } from "@/lib/stock";
import type { Part } from "@/types";

interface StockInFormProps {
  parts: Part[];
  branchId: string;
  onSuccess: () => void;
}

const today = new Date().toISOString().split("T")[0];

export default function StockInForm({ parts, branchId, onSuccess }: StockInFormProps) {
  const [form, setForm] = useState({
    part_id: "",
    quantity: 1,
    supplier: "",
    reference: "",
    remarks: "",
    date: today,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.part_id) { setError("Please select a part."); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await insertStockIn({ ...form, branch_id: branchId });
      setSuccess(true);
      setForm({ part_id: "", quantity: 1, supplier: "", reference: "", remarks: "", date: today });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record stock in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Part */}
      <div>
        <label className={labelClass}>Part <span className="text-red-500">*</span></label>
        <select
          required
          value={form.part_id}
          onChange={(e) => set("part_id", e.target.value)}
          className={inputClass}
        >
          <option value="">Select a part…</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.part_number} — {p.product_name} (stock: {p.stock})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Quantity <span className="text-red-500">*</span></label>
          <input
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Supplier + Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Supplier</label>
          <input
            type="text"
            value={form.supplier}
            onChange={(e) => set("supplier", e.target.value)}
            className={inputClass}
            placeholder="Denso Philippines"
          />
        </div>
        <div>
          <label className={labelClass}>Reference #</label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
            className={inputClass}
            placeholder="PO-2026-001"
          />
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className={labelClass}>Remarks</label>
        <input
          type="text"
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          className={inputClass}
          placeholder="New delivery from warehouse"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Stock in recorded successfully.</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <ArrowDownCircle className="w-4 h-4" />
        {saving ? "Saving…" : "Record Stock In"}
      </button>
    </form>
  );
}

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
