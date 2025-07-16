import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import helmet from 'fastify-helmet';
import dotenv from 'dotenv';
import prismaPlugin from './plugins/prisma';
import authenticatePlugin from './plugins/authenticate';
import authRoutes from './modules/auth/routes';
import ordersRoutes from './modules/orders/routes';
import invoicesRoutes from './modules/invoices/routes';
import productsRoutes from './modules/products/routes';
import costsRoutes from './modules/costs/routes';
import expensesRoutes from './modules/expenses/routes';
import transactionsRoutes from './modules/transactions/routes';
import cashboxRoutes from './modules/cashbox/routes';
import aiSettingsRoutes from './modules/ai-settings/routes';
import backupRoutes from './modules/backup/routes';
import aboutRoutes from './modules/about/routes';

dotenv.config();

const server = Fastify({ logger: true });

server.register(cors);
server.register(helmet);
server.register(fastifyJwt, { secret: process.env.JWT_SECRET! });
server.register(prismaPlugin);
server.register(authenticatePlugin);

server.register(authRoutes, { prefix: '/auth' });
server.register(ordersRoutes, { prefix: '/orders' });
server.register(invoicesRoutes, { prefix: '/invoices' });
server.register(productsRoutes, { prefix: '/products' });
server.register(costsRoutes, { prefix: '/costs' });
server.register(expensesRoutes, { prefix: '/expenses' });
server.register(transactionsRoutes, { prefix: '/transactions' });
server.register(cashboxRoutes, { prefix: '/cashbox' });
server.register(aiSettingsRoutes, { prefix: '/ai/settings' });
server.register(backupRoutes, { prefix: '/backup' });
server.register(aboutRoutes, { prefix: '/about' });

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log('Server running');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
