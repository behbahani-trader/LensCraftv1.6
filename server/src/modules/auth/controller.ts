import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginSchema, registerSchema } from './schema';
import * as service from './service';

export const registerHandler = async (fastify: FastifyInstance) => async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const data = registerSchema.parse(request.body);
  const user = await service.register(fastify, data.username, data.password);
  const token = fastify.jwt.sign({ id: user.id });
  reply.send({ token });
};

export const loginHandler = async (fastify: FastifyInstance) => async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const data = loginSchema.parse(request.body);
  const user = await service.login(fastify, data.username, data.password);
  if (!user) {
    return reply.status(401).send({ message: 'invalid credentials' });
  }
  const token = fastify.jwt.sign({ id: user.id });
  reply.send({ token });
};

export const meHandler = async (fastify: FastifyInstance) => async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as any).id;
  const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
  reply.send({ user });
};
