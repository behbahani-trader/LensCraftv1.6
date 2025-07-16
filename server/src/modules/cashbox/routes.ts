import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'cashbox list' }));
  fastify.post('/', async () => ({ message: 'cashbox create' }));
};

export default routes;
