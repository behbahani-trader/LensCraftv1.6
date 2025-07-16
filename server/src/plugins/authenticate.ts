import { FastifyPluginAsync } from 'fastify';

const authenticate: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw fastify.httpErrors.unauthorized();
    }
  });
};

export default authenticate;

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}
