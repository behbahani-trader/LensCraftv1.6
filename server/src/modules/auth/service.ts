import { FastifyInstance } from 'fastify';
import { hash, compare } from 'bcryptjs';

export const register = async (fastify: FastifyInstance, username: string, password: string) => {
  const hashed = await hash(password, 10);
  const user = await fastify.prisma.user.create({ data: { username, password: hashed } });
  return user;
};

export const login = async (fastify: FastifyInstance, username: string, password: string) => {
  const user = await fastify.prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const valid = await compare(password, user.password);
  if (!valid) return null;
  return user;
};
