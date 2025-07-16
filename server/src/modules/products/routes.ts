import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'products list' }));
  fastify.post('/', async () => ({ message: 'products create' }));
};

export default routes;
