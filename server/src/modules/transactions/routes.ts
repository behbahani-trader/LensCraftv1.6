import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'transactions list' }));
  fastify.post('/', async () => ({ message: 'transactions create' }));
};

export default routes;
