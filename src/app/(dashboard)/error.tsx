"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Algo deu errado</h2>
        <p className="text-sm text-gray-500 mb-4">
          {error.message || "Ocorreu um erro inesperado ao carregar esta página."}
        </p>
        <button
          onClick={reset}
          className="bg-[#1a3a6b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2554a0] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
