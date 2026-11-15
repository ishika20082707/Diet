import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.ts';
import { seedDatabase } from './server/seed/seedData.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

import authRoutes from './server/routes/auth.ts';
import memberRoutes from './server/routes/members.ts';
import planRoutes from './server/routes/plans.ts';
import saladRoutes from './server/routes/salads.ts';
import ingredientRoutes from './server/routes/ingredients.ts';
import customSaladRoutes from './server/routes/customSalads.ts';
import orderRoutes from './server/routes/orders.ts';
import subscriptionRoutes from './server/routes/subscriptions.ts';
import paymentRoutes from './server/routes/payments.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await connectDB();
  await seedDatabase(false);

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'verdant-bowl-api' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/salads', saladRoutes);
  app.use('/api/ingredients', ingredientRoutes);
  app.use('/api/custom-salads', customSaladRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/payments', paymentRoutes);

  app.use(errorHandler);

  // Serve generated images cleanly in both dev and production
  app.use(
    '/src/assets/images',
    express.static(path.resolve(__dirname, 'src/assets/images'))
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verdant Bowl MERN server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Verdant Bowl server:', err);
  process.exit(1);
});
