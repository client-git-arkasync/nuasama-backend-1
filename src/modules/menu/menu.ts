import { z } from 'zod';

export const menuListQuerySchema = z.object({
  category: z.string().optional(),
  product_type: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default('50').transform(Number),
});

export type MenuListQuery = z.infer<typeof menuListQuerySchema>;
