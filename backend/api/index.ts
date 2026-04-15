/**
 * api/index.ts — Main Hono app entry point for Vercel Serverless
 *
 * Handles all API routes via Hono routing.
 * Vercel rewrites route all /api/* requests to this file.
 */

import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { subscribeHandler } from './handlers/subscribe';
import { remindersHandler } from './handlers/reminders';
import { toggleHandler } from './handlers/toggle';
import { cronHandler } from './handlers/cron';

const app = new Hono().basePath('/api');

// ─── Health check ────────────────────────────────────────────────────
app.get('/', (c) => {
  return c.json({
    name: '叮咚 DingDong API',
    version: '1.0.0',
    status: 'ok',
    timestamp: Date.now(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────
app.route('/subscribe', subscribeHandler);
app.route('/reminders', remindersHandler);
app.route('/reminders', toggleHandler); // /reminders/:id/toggle
app.route('/cron/check-reminders', cronHandler);

// ─── 404 handler ─────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json(
    { error: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} not found` },
    404
  );
});

// ─── Error handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: 'INTERNAL_ERROR', message: 'Internal server error' },
    500
  );
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
