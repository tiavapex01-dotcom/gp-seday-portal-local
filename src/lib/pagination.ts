/**
 * @context pagination.ts
 * @what    Helpers for parsing and building pagination parameters
 * @purpose Standardise page/limit/skip across all paginated service calls
 * @depends Nothing
 * @usedby  user.service.ts, file.service.ts, communication.service.ts (via Zod schemas)
 * @rules   Max limit is capped at 100 to prevent runaway queries
 * @layer   lib
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10))
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(
  total: number,
  { page, limit }: PaginationParams
): PaginationMeta {
  return { total, page, limit, pages: Math.ceil(total / limit) };
}
