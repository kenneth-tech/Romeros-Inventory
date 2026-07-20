"use client";

import Image from "next/image";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <div className="relative w-24 h-24 animate-pulse">
          <Image
            src="/logo-romeros.png"
            alt="Romeros Inventory"
            fill
            className="object-contain animate-spin"
            style={{
              animationDuration: "2s",
              animationTimingFunction: "linear",
            }}
          />
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Romeros Inventory</p>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            Loading
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
