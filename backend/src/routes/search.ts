import { Router } from 'express';

import { query } from '../db';
import { productsRouter } from './products';

const router = Router();

function mapRowToProduct(row: {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  description_bn: string | null;
  price: number;
  category_id: string;
  scent_notes: string | null;
  burn_time: string | null;
  size: string | null;
  image_public_ids: string[];
  in_stock: boolean;
  is_active: boolean;
  created_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    nameBn: row.name_bn,
    description: row.description ?? '',
    descriptionBn: row.description_bn,
    price: row.price,
    category: row.category_id,
    scentNotes: row.scent_notes ?? '',
    burnTime: row.burn_time ?? '',
    size: row.size ?? '',
    imagePublicIds: row.image_public_ids ?? [],
    inStock: row.in_stock,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const category = req.query.category as string | undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const params: unknown[] = [];
    const conditions: string[] = ['is_active = true'];

    if (q) {
      conditions.push(
        `(name ILIKE $${params.length + 1} OR scent_notes ILIKE $${params.length + 1})`,
      );
      params.push(`%${q}%`);
    }

    if (category) {
      conditions.push(`category_id = $${params.length + 1}`);
      params.push(category);
    }

    if (minPrice !== undefined && !isNaN(minPrice)) {
      conditions.push(`price >= $${params.length + 1}`);
      params.push(minPrice);
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      conditions.push(`price <= $${params.length + 1}`);
      params.push(maxPrice);
    }

    let sql = `
      SELECT
        id, name, name_bn, description, description_bn, price,
        category_id, scent_notes, burn_time, size,
        image_public_ids, in_stock, is_active, created_at
      FROM products
      WHERE ${conditions.join(' AND ')}
    `;

    if (cursor) {
      sql += `
        AND (created_at, id) < (
          SELECT created_at, id FROM products WHERE id = $${params.length + 1}
        )
      `;
      params.push(cursor);
    }

    sql += ' ORDER BY created_at DESC, id DESC LIMIT $' + (params.length + 1);
    params.push(limit + 1);

    const result = await query(sql, params);
    const rows = result.rows as Parameters<typeof mapRowToProduct>[0][];

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const nextCursor =
      hasMore && rows.length > 0 ? rows[rows.length - 1].id : null;

    return res.json({
      products: rows.map(mapRowToProduct),
      nextCursor,
      total: result.rowCount ?? 0,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const result = await query<{ suggestion: string }>(
      `
        SELECT DISTINCT suggestion
        FROM (
          SELECT DISTINCT name AS suggestion
          FROM products
          WHERE is_active = true AND name ILIKE $1
          UNION
          SELECT DISTINCT scent_notes AS suggestion
          FROM products
          WHERE is_active = true
            AND scent_notes IS NOT NULL
            AND scent_notes ILIKE $1
            AND scent_notes != ''
        ) AS combined
        ORDER BY suggestion
        LIMIT 5
      `,
      [`%${q}%`],
    );

    return res.json({
      suggestions: result.rows.map((r) => r.suggestion),
    });
  } catch (error) {
    return next(error);
  }
});

export { router as searchRouter };