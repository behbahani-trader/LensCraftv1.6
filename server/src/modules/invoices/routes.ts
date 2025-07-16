import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'invoices list' }));
  fastify.post('/', async () => ({ message: 'invoices create' }));
};

export default routes;
