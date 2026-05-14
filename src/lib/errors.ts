/**
 * @context errors.ts
 * @what    AppError base class and typed HTTP error subclasses
 * @purpose Let services throw typed errors that api.ts converts to HTTP responses
 * @depends Nothing
 * @usedby  api.ts (withErrorHandling), services can throw these instead of raw Error
 * @rules   Keep status codes stable — 401/403/404/409/422 are contract with the frontend
 * @layer   lib
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado') { super(message, 401); }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Sem permissão') { super(message, 403); }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') { super(`${resource} não encontrado`, 404); }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 422); }
}
