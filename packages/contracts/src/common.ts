import { z } from 'zod';

export const ApiError = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

export const PaginationParams = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const PaginatedResponse = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type ApiError = z.infer<typeof ApiError>;
export type PaginationParams = z.infer<typeof PaginationParams>;
export type PaginatedResponse<T = any> = Omit<z.infer<typeof PaginatedResponse>, 'data'> & { data: T[] };
