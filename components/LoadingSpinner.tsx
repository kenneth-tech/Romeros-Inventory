"use client";

import Image from "next/image";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <div className="relative w-32 h-32">
          <Image
            src="/logo-romeros.png"
            alt="Loading"
            fill
            className="object-contain"
          />
        </div>

        {/* Loading Bar */}
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-full animate-pulse"
            style={{
              animation: "shimmer 2s infinite",
              backgroundSize: "200% 100%",
            }}
          />
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
