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
