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
