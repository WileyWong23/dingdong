/**
 * api/cron/check-reminders.ts — Standalone Vercel Cron endpoint
 *
 * This file provides a dedicated entry point for Vercel Cron Jobs.
 * Vercel Cron triggers /api/cron/check-reminders every minute.
 * Protected by CRON_SECRET environment variable.
 */

import { handle } from 'hono/vercel';
import { cronHandler } from '../handlers/cron';
import { Hono } from 'hono';

const app = new Hono();

// Pass through all requests to the cron handler
app.all('/', (c) => cronHandler.fetch(c.req.raw));

export const GET = handle(app);
