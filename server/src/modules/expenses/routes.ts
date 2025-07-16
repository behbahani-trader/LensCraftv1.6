import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'expenses list' }));
  fastify.post('/', async () => ({ message: 'expenses create' }));
};

export default routes;
