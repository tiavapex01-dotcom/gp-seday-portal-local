"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Algo deu errado</h2>
          <p className="text-sm text-gray-500 mb-4">
            {error.message || "Ocorreu um erro inesperado. Tente novamente."}
          </p>
          <button
            onClick={reset}
            className="bg-[#1a3a6b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2554a0] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
