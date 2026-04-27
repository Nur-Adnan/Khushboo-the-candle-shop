import { Router } from 'express';

import { query } from '../db';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await query<{
      id: string;
      name: string;
      name_bn: string | null;
      image_public_id: string | null;
      product_count: number;
    }>(
      `
        SELECT
          id,
          name,
          name_bn,
          image_public_id,
          product_count
        FROM categories
        ORDER BY name ASC
      `,
    );

    const categories = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      nameBn: row.name_bn,
      imagePublicId: row.image_public_id,
      productCount: row.product_count,
    }));

    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
});

export { router as categoriesRouter };