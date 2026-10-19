import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { LoginDto, RegisterDto } from './auth.dto.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password.js';

export const publicUserSelect = { id: true, name: true, username: true, email: true, role: true } as const;
export type PublicUser = { id: number; name: string; username: string | null; email: string | null; role: 'ADMIN' | 'CLIENTE' };
export const SESSION_COOKIE = 'maiashoes_session';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async register(data: RegisterDto) {
    let user: PublicUser;
    try {
      user = await this.prisma.user.create({
        data: { name: data.name, email: data.email, passwordHash: await hashPassword(data.password), role: 'CLIENTE' },
        select: publicUserSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
    return this.startSession(user);
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: data.username.includes('@') ? { email: data.username } : { username: data.username } });
    const valid = await verifyPassword(data.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user?.passwordHash || !valid) throw new UnauthorizedException('Usuário ou senha inválidos.');
    return this.startSession({ id: user.id, name: user.name, username: user.username, email: user.email, role: user.role });
  }

  async loginWithGoogle(identity: { sub: string; email: string; name: string }) {
    let user = await this.prisma.user.findUnique({ where: { googleSub: identity.sub }, select: publicUserSelect });
    if (!user) {
      // Nunca vincular por e-mail: contas locais ainda não verificam esse endereço.
      if (await this.prisma.user.findUnique({ where: { email: identity.email } })) {
        throw new ConflictException('Entre com sua senha: este e-mail já possui uma conta.');
      }
      try {
        user = await this.prisma.user.create({ data: { name: identity.name, email: identity.email, googleSub: identity.sub, role: 'CLIENTE' }, select: publicUserSelect });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('Já existe uma conta para este acesso. Tente novamente.');
        }
        throw error;
      }
    }
    return this.startSession(user);
  }

  private async startSession(user: PublicUser) {
    const token = randomBytes(32).toString('hex');
    await this.prisma.session.create({ data: {
      tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    } });
    return { user, token };
  }

  async authenticate(token: string | undefined): Promise<PublicUser> {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException('Faça login para continuar.');
    const session = await this.prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { select: publicUserSelect } } });
    if (!session || session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('Sua sessão expirou. Entre novamente.');
    return session.user;
  }

  async logout(token: string | undefined) {
    if (token && /^[a-f0-9]{64}$/.test(token)) await this.prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  }
}
