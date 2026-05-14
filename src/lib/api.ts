/**
 * @context api.ts
 * @what    HTTP response helpers and error-handling wrapper for API routes
 * @purpose Avoid repeating NextResponse.json(...) patterns in every route handler
 * @depends errors.ts (AppError hierarchy), ZodError from zod
 * @usedby  All API route handlers under src/app/api/
 * @rules   Every API route MUST use these helpers instead of raw NextResponse.json
 * @layer   lib
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod/v4';
import { AppError } from './errors';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function err(message: string, status: number, details?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function fromZodError(e: ZodError) {
  return err('Dados inválidos', 422, e.flatten().fieldErrors);
}

export function unauthorized(message = 'Não autenticado') {
  return err(message, 401);
}

export function forbidden(message = 'Sem permissão') {
  return err(message, 403);
}

export function notFound(resource = 'Recurso') {
  return err(`${resource} não encontrado`, 404);
}

export function conflict(message: string) {
  return err(message, 409);
}

export function internalError(message = 'Erro interno do servidor') {
  return err(message, 500);
}

// Wraps a handler, converts AppErrors to HTTP responses, logs unexpected errors
export function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((error: unknown) => {
    if (error instanceof AppError) {
      return err(error.message, error.status);
    }
    console.error('[API Error]', error);
    return internalError();
  });
}
