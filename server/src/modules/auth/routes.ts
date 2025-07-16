import { FastifyPluginAsync } from 'fastify';
import { registerHandler, loginHandler, meHandler } from './controller';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', registerHandler(fastify));
  fastify.post('/login', loginHandler(fastify));
  fastify.get('/me', { preValidation: [fastify.authenticate] }, meHandler(fastify));
};

export default authRoutes;
