import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'ai-settings list' }));
  fastify.post('/', async () => ({ message: 'ai-settings create' }));
};

export default routes;
