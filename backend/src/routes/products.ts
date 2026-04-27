import { Router } from 'express';

import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

type ProductRow = {
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
};

function mapRowToProduct(row: ProductRow) {
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
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const category = req.query.category as string | undefined;

    let sql = `
      SELECT
        id, name, name_bn, description, description_bn, price,
        category_id, scent_notes, burn_time, size,
        image_public_ids, in_stock, is_active, created_at
      FROM products
      WHERE is_active = true
    `;
    const params: unknown[] = [];

    if (cursor) {
      sql += `
        AND (created_at, id) < (
          SELECT created_at, id FROM products WHERE id = $1
        )
      `;
      params.push(cursor);
    }

    if (category) {
      sql += ' AND category_id = $' + (params.length + 1);
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC, id DESC LIMIT $' + (params.length + 1);
    params.push(limit + 1);

    const result = await query<ProductRow>(sql, params);
    const rows = result.rows;

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const nextCursor = hasMore && rows.length > 0
      ? rows[rows.length - 1].id
      : null;

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM products WHERE is_active = true',
    );
    const total = countResult.rows[0]?.count ?? 0;

    return res.json({
      products: rows.map(mapRowToProduct),
      nextCursor,
      total,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query<ProductRow>(
      `
        SELECT
          id, name, name_bn, description, description_bn, price,
          category_id, scent_notes, burn_time, size,
          image_public_ids, in_stock, is_active, created_at
        FROM products
        WHERE id = $1 AND is_active = true
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: true,
        message: 'Product not found',
        code: 'NOT_FOUND',
      });
    }

    return res.json({ product: mapRowToProduct(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      scentNotes,
      burnTime,
      size,
      images,
      inStock = true,
      nameBn,
      descriptionBn,
    } = req.body as Record<string, unknown>;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: true,
        message: 'Name is required',
        code: 'VALIDATION_ERROR',
      });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        error: true,
        message: 'Price must be a non-negative number',
        code: 'VALIDATION_ERROR',
      });
    }
    if (typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        error: true,
        message: 'Category is required',
        code: 'VALIDATION_ERROR',
      });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'At least one image is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await query<ProductRow>(
      `
        INSERT INTO products (
          name, name_bn, description, description_bn, price,
          category_id, scent_notes, burn_time, size,
          image_public_ids, in_stock
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
          id, name, name_bn, description, description_bn, price,
          category_id, scent_notes, burn_time, size,
          image_public_ids, in_stock, is_active, created_at
      `,
      [
        (name as string).trim(),
        (nameBn as string)?.trim() ?? null,
        (description as string)?.trim() ?? null,
        (descriptionBn as string)?.trim() ?? null,
        price,
        category.trim(),
        (scentNotes as string)?.trim() ?? null,
        (burnTime as string)?.trim() ?? null,
        (size as string)?.trim() ?? null,
        images,
        inStock,
      ],
    );

    await query(
      'UPDATE categories SET product_count = product_count + 1 WHERE id = $1',
      [category.trim()],
    );

    return res.status(201).json({ product: mapRowToProduct(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    const allowedFields = [
      'name', 'name_bn', 'description', 'description_bn', 'price',
      'category_id', 'scent_notes', 'burn_time', 'size',
      'image_public_ids', 'in_stock', 'is_active',
    ];
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      const snakeField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const key = field in updates ? field : camelField in updates ? camelField : null;
      if (key !== null && updates[key] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        params.push(updates[key]);
        paramIndex++;
      }
    }

    if (paramIndex === 1) {
      return res.status(400).json({
        error: true,
        message: 'No valid fields provided for update',
        code: 'VALIDATION_ERROR',
      });
    }

    params.push(id);

    const result = await query<ProductRow>(
      `
        UPDATE products
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id, name, name_bn, description, description_bn, price,
          category_id, scent_notes, burn_time, size,
          image_public_ids, in_stock, is_active, created_at
      `,
      params,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: true,
        message: 'Product not found',
        code: 'NOT_FOUND',
      });
    }

    return res.json({ product: mapRowToProduct(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query<{ category_id: string; image_public_ids: string[] }>(
      'SELECT category_id, image_public_ids FROM products WHERE id = $1',
      [id],
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        error: true,
        message: 'Product not found',
        code: 'NOT_FOUND',
      });
    }

    const { category_id, image_public_ids } = existing.rows[0];

    await query('DELETE FROM products WHERE id = $1', [id]);
    await query(
      'UPDATE categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = $1',
      [category_id],
    );

    if (Array.isArray(image_public_ids) && image_public_ids.length > 0) {
      if (
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_CLOUD_NAME
      ) {
        try {
          const { v2: cloudinary } = await import('cloudinary');
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });
          await Promise.all(
            image_public_ids.map((publicId: string) =>
              cloudinary.uploader.destroy(publicId),
            ),
          );
        } catch {
          // best-effort cleanup
        }
      }
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body as { isActive?: unknown };

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: true,
        message: 'isActive must be a boolean',
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await query<ProductRow>(
      `
        UPDATE products
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING
          id, name, name_bn, description, description_bn, price,
          category_id, scent_notes, burn_time, size,
          image_public_ids, in_stock, is_active, created_at
      `,
      [isActive, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: true,
        message: 'Product not found',
        code: 'NOT_FOUND',
      });
    }

    return res.json({ product: mapRowToProduct(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

// Admin-only: get all products including inactive
router.get('/admin/all', requireAuth, async (req, res, next) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = req.query.search as string | undefined;

    let sql = `
      SELECT
        id, name, name_bn, description, description_bn, price,
        category_id, scent_notes, burn_time, size,
        image_public_ids, in_stock, is_active, created_at
      FROM products
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (search) {
      sql += ' AND (name ILIKE $' + (params.length + 1) + ' OR scent_notes ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

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

    const result = await query<ProductRow>(sql, params);
    const rows = result.rows;

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const nextCursor = hasMore && rows.length > 0
      ? rows[rows.length - 1].id
      : null;

    return res.json({
      products: rows.map(mapRowToProduct),
      nextCursor,
      total: result.rowCount ?? 0,
    });
  } catch (error) {
    return next(error);
  }
});

export { router as productsRouter };