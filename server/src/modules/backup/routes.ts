import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => ({ message: 'backup list' }));
  fastify.post('/', async () => ({ message: 'backup create' }));
};

export default routes;
