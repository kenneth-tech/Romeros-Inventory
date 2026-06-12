"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Part } from "@/types";
import type { PartInput } from "@/lib/parts";

interface PartModalProps {
  isOpen: boolean;
  part: Part | null;
  onClose: () => void;
  onSave: (data: PartInput) => Promise<void>;
}

const empty: PartInput = {
  part_number: "",
  product_name: "",
  category: "",
  vehicle_compatibility: "",
  stock: 0,
  min_stock: 1,
  cost_price: 0,
  selling_price: 0,
  supplier: "",
  location: "",
};

export default function PartModal({
  isOpen,
  part,
  onClose,
  onSave,
}: PartModalProps) {
  const [form, setForm] = useState<PartInput>(empty);
  const [costStr, setCostStr] = useState("0");
  const [sellingStr, setSellingStr] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const src = part ?? empty;
      setForm({
        part_number: src.part_number,
        product_name: src.product_name,
        category: src.category,
        vehicle_compatibility: src.vehicle_compatibility,
        stock: src.stock,
        min_stock: src.min_stock,
        cost_price: src.cost_price,
        selling_price: src.selling_price,
        supplier: src.supplier,
        location: src.location,
      });
      setCostStr(String(src.cost_price));
      setSellingStr(String(src.selling_price));
      setError(null);
    }
  }, [isOpen, part]);

  if (!isOpen) return null;

  function set(field: keyof PartInput, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        cost_price: parseFloat(costStr) || 0,
        selling_price: parseFloat(sellingStr) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save part.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {part ? "Edit Part" : "Add New Part"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Part Number + Product Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Part Number" required>
              <input
                type="text"
                required
                value={form.part_number}
                onChange={(e) => set("part_number", e.target.value)}
                className={inputClass}
                placeholder="DCP17045"
              />
            </Field>
            <Field label="Product Name" required>
              <input
                type="text"
                required
                value={form.product_name}
                onChange={(e) => set("product_name", e.target.value)}
                className={inputClass}
                placeholder="Denso Compressor"
              />
            </Field>
          </div>

          {/* Category + Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <input
                type="text"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputClass}
                placeholder="Compressor"
              />
            </Field>
            <Field label="Vehicle Compatibility">
              <input
                type="text"
                value={form.vehicle_compatibility}
                onChange={(e) => set("vehicle_compatibility", e.target.value)}
                className={inputClass}
                placeholder="Toyota Vios"
              />
            </Field>
          </div>

          {/* Stock + Min Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Stock">
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Min Stock">
              <input
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => set("min_stock", Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Cost + Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cost Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={costStr}
                  onChange={(e) => setCostStr(e.target.value)}
                  className={inputClass + " pl-7"}
                  placeholder="0.00"
                />
              </div>
            </Field>
            <Field label="Selling Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sellingStr}
                  onChange={(e) => setSellingStr(e.target.value)}
                  className={inputClass + " pl-7"}
                  placeholder="0.00"
                />
              </div>
            </Field>
          </div>

          {/* Supplier + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Supplier">
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => set("supplier", e.target.value)}
                className={inputClass}
                placeholder="Denso Philippines"
              />
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className={inputClass}
                placeholder="Shelf A-1"
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium transition-colors"
            >
              {saving ? "Saving…" : part ? "Save Changes" : "Add Part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
