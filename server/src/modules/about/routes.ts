import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'about list' }));
  fastify.post('/', async () => ({ message: 'about create' }));
};

export default routes;
