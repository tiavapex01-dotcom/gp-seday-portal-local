/**
 * @context utils.ts
 * @what    Pure formatting and string utility functions
 * @purpose Centralise formatting so components don't inline repetitive logic
 * @depends Nothing
 * @usedby  FileCard, CommunicationCard, and any component needing formatting
 * @rules   No React, no Prisma, no Next.js — pure functions only
 * @layer   lib
 */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)                    return `${bytes} B`;
  if (bytes < 1024 * 1024)             return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export const sanitizeDigits = (str: string): string => str.replace(/\D/g, "");

export function truncate(str: string, max: number): string {
  return str.length <= max ? str : `${str.slice(0, max)}…`;
}
