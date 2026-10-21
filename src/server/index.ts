import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';

// --- IMPORT TRIGGERS ---
import { handleAppInstall } from './triggers/install.js';
import { handleAppUpgrade } from './triggers/upgrade.js';

// --- IMPORT SCHEDULER ---
import { handleUpgradeCheckJob } from './scheduler/upgradeJob.js';
import { handleWeatherUpdateJob } from './scheduler/weatherUpdateJob.js';

const app = new Hono();

// ==========================================
// ROUTES
// ==========================================

// Triggers
app.post('/internal/triggers/on-app-install', handleAppInstall);
app.post('/internal/triggers/on-app-upgrade', handleAppUpgrade);

// Scheduler
app.post('/internal/scheduler/upgrade-notifier-job', handleUpgradeCheckJob);
app.post('/internal/weather-update', handleWeatherUpdateJob);

serve({
    fetch: app.fetch,
    createServer,
    port: getServerPort(),
});