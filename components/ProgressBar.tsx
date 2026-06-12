"use client";

import { useEffect, useState } from "react";

export default function ProgressBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsVisible(true);
    };

    const handleStop = () => {
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    };

    window.addEventListener("beforeunload", handleStart);
    window.addEventListener("load", handleStop);

    return () => {
      window.removeEventListener("beforeunload", handleStart);
      window.removeEventListener("load", handleStop);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 backdrop-blur-sm">
          <div className="relative w-12 h-12">
            <svg
              className="animate-spin"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
                className="text-gray-200"
              />
              <path
                d="M 24 4 A 20 20 0 0 1 44 24"
                stroke="currentColor"
                strokeWidth="3"
                className="text-blue-600"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
