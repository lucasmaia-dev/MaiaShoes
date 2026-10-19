import { Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../database/prisma.service.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const GOOGLE_COOKIE = 'maiashoes_google';
export const GOOGLE_DURATION_MS = 10 * 60 * 1000;

@Injectable()
export class GoogleService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  configuration() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = process.env.APP_ORIGIN;
    if (!clientId || !clientSecret || !origin) return null;
    try {
      const url = new URL(origin);
      const local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:';
      if ((!local && url.protocol !== 'https:') || url.origin !== origin || url.username || url.password) return null;
      return { clientId, clientSecret, origin, redirectUri: `${origin}/api/auth/google/callback` };
    } catch { return null; }
  }

  private client() {
    const config = this.configuration();
    if (!config) throw new ServiceUnavailableException('O login com Google ainda não foi configurado.');
    return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
  }

  async start() {
    const client = this.client();
    const state = randomBytes(32).toString('hex');
    const browser = randomBytes(32).toString('hex');
    const nonce = randomBytes(32).toString('hex');
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    await this.prisma.googleLoginAttempt.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    await this.prisma.googleLoginAttempt.create({ data: {
      stateHash: hash(state), browserHash: hash(browser), nonce, codeVerifier,
      expiresAt: new Date(Date.now() + GOOGLE_DURATION_MS),
    } });
    const url = client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], response_type: 'code', state, nonce,
      code_challenge: codeChallenge, code_challenge_method: CodeChallengeMethod.S256, prompt: 'select_account' });
    return { url, browser };
  }

  async finish(code: unknown, state: unknown, browser: string | undefined) {
    if (typeof code !== 'string' || !code || code.length > 4096 || typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state) || !browser || !/^[a-f0-9]{64}$/.test(browser)) {
      throw new UnauthorizedException('Tentativa de login inválida.');
    }
    const where = { stateHash: hash(state), browserHash: hash(browser), expiresAt: { gt: new Date() } };
    const attempt = await this.prisma.googleLoginAttempt.findFirst({ where });
    // Exclusão condicional garante que duas callbacks não consumam a mesma tentativa.
    if (!attempt || (await this.prisma.googleLoginAttempt.deleteMany({ where })).count !== 1) {
      throw new UnauthorizedException('Tentativa de login expirada ou já utilizada.');
    }
    const client = this.client();
    const { tokens } = await client.getToken({ code, codeVerifier: attempt.codeVerifier });
    if (!tokens.id_token) throw new UnauthorizedException('O Google não confirmou sua identidade.');
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: this.configuration()!.clientId });
    const payload = ticket.getPayload();
    if (!payload || payload.nonce !== attempt.nonce || !payload.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException('O Google não confirmou seu e-mail.');
    }
    const email = payload.email.trim().toLowerCase();
    if (email.length > 254) throw new UnauthorizedException('E-mail inválido.');
    return { sub: payload.sub, email, name: (payload.name || email.split('@')[0]).slice(0, 100) };
  }
}
