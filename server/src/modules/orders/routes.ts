import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'orders list' }));
  fastify.post('/', async () => ({ message: 'orders create' }));
};

export default routes;
