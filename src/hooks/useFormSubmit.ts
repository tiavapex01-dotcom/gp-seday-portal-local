/**
 * @context useFormSubmit.ts
 * @what    Custom hook for form submit — loading, error, and optional success states
 * @purpose DRY pattern shared by 5+ form components that all have the same loading/error useState pair
 * @depends react
 * @usedby  CreateFolderForm, CreateSectorButton, and any future form components
 * @layer   hook
 */
"use client";

import { useState } from "react";

export function useFormSubmit<T>(
  fn: () => Promise<T>,
  onSuccess?: (result: T) => void
) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const result = await fn();
      onSuccess?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error, setError };
}
