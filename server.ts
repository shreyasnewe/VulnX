import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import connectDB from './backend/config/db';
import healthRoutes from './backend/routes/healthRoutes';
import securityRoutes from './backend/routes/securityRoutes';
import authRoutes from './backend/routes/authRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Mount API routes FIRST
  app.use('/api/auth', authRoutes);
  app.use('/api', securityRoutes);
  app.use('/api', healthRoutes);

  // Fallback API test route
  app.get('/api/ping', (req, res) => {
    res.json({ message: 'VulnX VAPT API Server is operational', timestamp: new Date() });
  });

  // Attempt database connection in background (does not block server startup)
  connectDB().catch((err) => {
    console.warn('[VulnX] Database initialization warning:', err.message);
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[VulnX SOC] Server ready!`);
    console.log(`  ➜ Local:   http://localhost:${PORT}`);
    console.log(`  ➜ Network: http://127.0.0.1:${PORT}\n`);
  });
}

startServer().catch((err) => {
  console.error('[VulnX SOC] Failed to start server:', err);
});
