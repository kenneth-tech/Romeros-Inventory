import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  description?: string;
  alert?: boolean;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  description,
  alert = false,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex items-start gap-4 shadow-sm ${
        alert ? "border-red-300 bg-red-50" : "border-gray-200"
      }`}
    >
      <div className={`${iconBg} rounded-xl p-3 shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${alert ? "text-red-600" : "text-gray-500"}`}>
          {title}
        </p>
        <p className={`text-2xl font-bold mt-0.5 ${alert ? "text-red-700" : "text-gray-900"}`}>
          {value}
        </p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
