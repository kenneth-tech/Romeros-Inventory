import { type LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  description?: string;
  alert?: boolean;
  trend?: number;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  description,
  alert = false,
  trend,
}: StatCardProps) {
  const isPositiveTrend = trend && trend >= 0;

  return (
    <div
      className={`relative bg-white rounded-xl border transition-all duration-200 hover:shadow-lg hover:border-opacity-50 ${
        alert 
          ? "border-red-200 shadow-sm" 
          : "border-gray-200 shadow-sm hover:border-blue-200"
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`${iconBg} rounded-lg p-3`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              isPositiveTrend ? "text-green-600" : "text-red-600"
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div>
          <p className={`text-sm font-medium mb-1 ${
            alert ? "text-red-600" : "text-gray-600"
          }`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${
            alert ? "text-red-700" : "text-gray-900"
          }`}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>

      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
        alert ? "bg-red-400" : "bg-gradient-to-r from-blue-400 to-blue-600"
      }`} />
    </div>
  );
}
