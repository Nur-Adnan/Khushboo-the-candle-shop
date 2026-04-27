import { Router } from 'express';

import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

const VALID_EVENT_TYPES = [
  'product_view',
  'wishlist_add',
  'wishlist_remove',
  'order_intent',
  'product_share',
] as const;

type EventType = (typeof VALID_EVENT_TYPES)[number];

router.post('/events', async (req, res, next) => {
  try {
    const { events } = req.body as { events?: unknown };

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'events must be a non-empty array',
        code: 'VALIDATION_ERROR',
      });
    }

    const validEvents: Array<{
      type: EventType;
      productId: string;
      timestamp: string;
      sessionId: string;
      eventHash?: string;
    }> = [];

    for (const event of events) {
      if (
        typeof event !== 'object' ||
        event === null ||
        Array.isArray(event)
      ) {
        continue;
      }

      const e = event as Record<string, unknown>;

      if (
        typeof e.type !== 'string' ||
        !VALID_EVENT_TYPES.includes(e.type as EventType)
      ) {
        continue;
      }
      if (typeof e.productId !== 'string' || !e.productId) continue;
      if (typeof e.timestamp !== 'string' || !e.timestamp) continue;
      if (typeof e.sessionId !== 'string' || !e.sessionId) continue;

      validEvents.push({
        type: e.type as EventType,
        productId: e.productId as string,
        timestamp: e.timestamp as string,
        sessionId: e.sessionId as string,
        eventHash: typeof e.eventHash === 'string' ? e.eventHash : undefined,
      });
    }

    if (validEvents.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No valid events provided',
        code: 'VALIDATION_ERROR',
      });
    }

    const values: unknown[] = [];
    const valuePlaceholders: string[] = [];

    validEvents.forEach((e, i) => {
      valuePlaceholders.push(
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`,
      );
      values.push(e.type, e.productId, e.sessionId, e.eventHash ?? null);
    });

    await query(
      `INSERT INTO analytics_events (event_type, product_id, session_id, event_hash)
       VALUES ${valuePlaceholders.join(', ')}`,
      values,
    );

    return res.json({ received: validEvents.length });
  } catch (error) {
    return next(error);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rawStart = req.query.startDate as string | undefined;
    const rawEnd = req.query.endDate as string | undefined;

    const startDate = rawStart
      ? new Date(rawStart).toISOString()
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = rawEnd
      ? new Date(rawEnd).toISOString()
      : new Date().toISOString();

    const [viewsResult, wishlistResult, orderResult] = await Promise.all([
      query<{ count: string }>(
        `
          SELECT COUNT(*)::int AS count
          FROM analytics_events
          WHERE event_type = 'product_view'
            AND created_at >= $1
            AND created_at <= $2
        `,
        [startDate, endDate],
      ),
      query<{ count: string }>(
        `
          SELECT COUNT(*)::int AS count
          FROM analytics_events
          WHERE event_type = 'wishlist_add'
            AND created_at >= $1
            AND created_at <= $2
        `,
        [startDate, endDate],
      ),
      query<{ count: string }>(
        `
          SELECT COUNT(*)::int AS count
          FROM analytics_events
          WHERE event_type = 'order_intent'
            AND created_at >= $1
            AND created_at <= $2
        `,
        [startDate, endDate],
      ),
    ]);

    const topProductsResult = await query<{
      product_id: string | null;
      name: string | null;
      image_public_ids: string[] | null;
      view_count: number;
    }>(
      `
        SELECT
          ae.product_id,
          p.name,
          p.image_public_ids,
          COUNT(*)::int AS view_count
        FROM analytics_events ae
        LEFT JOIN products p ON p.id = ae.product_id
        WHERE ae.event_type = 'product_view'
          AND ae.created_at >= $1
          AND ae.created_at <= $2
        GROUP BY ae.product_id, p.name, p.image_public_ids
        ORDER BY view_count DESC
        LIMIT 10
      `,
      [startDate, endDate],
    );

    const topProducts = topProductsResult.rows
      .filter((row) => row.product_id !== null)
      .map((row) => ({
        id: row.product_id,
        name: row.name ?? 'Unknown',
        imagePublicIds: row.image_public_ids ?? [],
        viewCount: row.view_count,
      }));

    return res.json({
      totalViews: viewsResult.rows[0]?.count ?? 0,
      totalWishlistAdds: wishlistResult.rows[0]?.count ?? 0,
      totalOrderIntents: orderResult.rows[0]?.count ?? 0,
      topProducts,
    });
  } catch (error) {
    return next(error);
  }
});

export { router as analyticsRouter };