import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'costs list' }));
  fastify.post('/', async () => ({ message: 'costs create' }));
};

export default routes;
