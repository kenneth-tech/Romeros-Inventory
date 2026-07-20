"use client";

import { useState } from "react";
import { ArrowUpCircle, Trash2, Plus } from "lucide-react";
import { insertStockOutMultiple } from "@/lib/stock";
import type { Part } from "@/types";

interface StockOutFormProps {
  parts: Part[];
  branchId: string;
  onSuccess: () => void;
}

interface LineItem {
  id: string;
  part_id: string;
  quantity: number;
}

const today = new Date().toISOString().split("T")[0];

export default function StockOutForm({ parts, branchId, onSuccess }: StockOutFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({
    reference: "",
    remarks: "",
    date: today,
  });
  const [partInput, setPartInput] = useState({ part_id: "", quantity: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function addLineItem() {
    if (!partInput.part_id) {
      setError("Please select a part.");
      return;
    }

    const selected = parts.find((p) => p.id === partInput.part_id);
    if (!selected) {
      setError("Part not found.");
      return;
    }

    if (partInput.quantity > selected.stock) {
      setError(`Insufficient stock for ${selected.product_name}. Available: ${selected.stock}`);
      return;
    }

    // Check if part already in cart
    const existingItem = lineItems.find((item) => item.part_id === partInput.part_id);
    if (existingItem) {
      setError("This part is already in the cart. Edit the quantity or remove it first.");
      return;
    }

    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        part_id: partInput.part_id,
        quantity: partInput.quantity,
      },
    ]);
    setPartInput({ part_id: "", quantity: 1 });
    setError(null);
  }

  function removeLineItem(id: string) {
    setLineItems(lineItems.filter((item) => item.id !== id));
  }

  function updateLineItemQuantity(id: string, quantity: number) {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lineItems.length === 0) {
      setError("Please add at least one part.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await insertStockOutMultiple({
        lineItems,
        branch_id: branchId,
        reference: form.reference,
        remarks: form.remarks,
        date: form.date,
      });
      setSuccess(true);
      setLineItems([]);
      setForm({ reference: "", remarks: "", date: today });
      setPartInput({ part_id: "", quantity: 1 });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record stock out.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Add Part Section */}
      <div className="border-b pb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Add Parts</h3>
        
        {/* Part Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Part <span className="text-red-500">*</span></label>
            <select
              value={partInput.part_id}
              onChange={(e) => setPartInput((prev) => ({ ...prev, part_id: e.target.value }))}
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
          <div>
            <label className={labelClass}>Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              value={partInput.quantity}
              onChange={(e) => setPartInput((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Parts
        </button>
      </div>

      {/* Cart Summary */}
      {lineItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Items in Cart ({lineItems.length})</h3>
          <div className="space-y-2">
            {lineItems.map((item) => {
              const part = parts.find((p) => p.id === item.part_id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {part?.part_number} — {part?.product_name}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-gray-600">Qty:</span>
                      <input
                        type="number"
                        min={1}
                        max={part?.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItemQuantity(item.id, Number(e.target.value))
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 font-medium"
                      />
                      <span className="text-xs text-gray-500">
                        (Available: {part?.stock})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction Details */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-3">Transaction Details</h3>

        {/* Customer / Job Reference */}
        <div className="mb-3">
          <label className={labelClass}>Customer / Job Reference</label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
            className={inputClass}
            placeholder="Juan dela Cruz — Toyota Vios"
          />
        </div>

        {/* Remarks */}
        <div className="mb-3">
          <label className={labelClass}>Purpose / Remarks</label>
          <input
            type="text"
            value={form.remarks}
            onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
            className={inputClass}
            placeholder="Installed for service job / Sold over counter"
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Stock out recorded successfully for {lineItems.length} part(s).
        </p>
      )}

      <button
        type="submit"
        disabled={saving || lineItems.length === 0}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <ArrowUpCircle className="w-4 h-4" />
        {saving ? "Saving…" : `Record Stock Out (${lineItems.length} part${lineItems.length !== 1 ? "s" : ""})`}
      </button>
    </form>
  );
}

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
