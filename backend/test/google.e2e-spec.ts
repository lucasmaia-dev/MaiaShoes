import { GoogleService } from '../src/auth/google.service.js';
import { AuthService } from '../src/auth/auth.service.js';
import type { PrismaService } from '../src/database/prisma.service.js';

const oauth = vi.hoisted(() => ({ exchange: vi.fn(), verify: vi.fn() }));
vi.mock('google-auth-library', () => ({
  CodeChallengeMethod: { S256: 'S256' },
  OAuth2Client: class {
    generateCodeVerifierAsync() { return Promise.resolve({ codeVerifier: 'pkce-secret', codeChallenge: 'challenge' }); }
    generateAuthUrl(options: Record<string, string>) { return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(options)}`; }
    getToken = oauth.exchange;
    verifyIdToken = oauth.verify;
  },
}));

describe('Login Google: tentativa, identidade e contas', () => {
  let attempt: Record<string, any> | null;
  let prisma: any;
  let service: GoogleService;
  beforeEach(() => {
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'client-test');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'secret-test');
    attempt = null;
    prisma = {
      googleLoginAttempt: {
        create: vi.fn(({ data }) => { attempt = data; return Promise.resolve(data); }),
        findFirst: vi.fn(({ where }) => Promise.resolve(attempt && attempt.stateHash === where.stateHash && attempt.browserHash === where.browserHash && attempt.expiresAt > where.expiresAt.gt ? attempt : null)),
        deleteMany: vi.fn(({ where }) => {
          const count = attempt && (where.stateHash ? attempt.stateHash === where.stateHash && attempt.browserHash === where.browserHash && attempt.expiresAt > where.expiresAt.gt : attempt.expiresAt <= where.expiresAt.lte) ? 1 : 0;
          if (count) attempt = null;
          return Promise.resolve({ count });
        }),
      },
      user: { findUnique: vi.fn(), create: vi.fn() },
      session: { create: vi.fn().mockResolvedValue({}) },
    };
    service = new GoogleService(prisma as PrismaService);
    oauth.exchange.mockReset().mockResolvedValue({ tokens: { id_token: 'signed-token' } });
    oauth.verify.mockReset().mockImplementation(() => Promise.resolve({ getPayload: () => ({ sub: 'google-123', email: 'Cliente@Example.com', email_verified: true, name: 'Cliente', nonce: attempt?.nonce }) }));
  });
  afterEach(() => vi.unstubAllEnvs());

  async function start() {
    const result = await service.start();
    const state = new URL(result.url).searchParams.get('state')!;
    const nonce = attempt!.nonce;
    oauth.verify.mockResolvedValue({ getPayload: () => ({ sub: 'google-123', email: 'Cliente@Example.com', email_verified: true, name: 'Cliente', nonce }) });
    return { ...result, state, nonce };
  }

  it('desabilita o Google sem configuração e recusa origem insegura em produção', async () => {
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    expect(service.configuration()).toBeNull();
    await expect(service.start()).rejects.toThrow();
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test'); vi.stubEnv('NODE_ENV', 'production');
    expect(service.configuration()).toBeNull();
  });

  it('usa PKCE, nonce e state; persiste hashes dos segredos de navegador', async () => {
    const result = await start();
    const url = new URL(result.url);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('nonce')).toBe(result.nonce);
    expect(attempt!.stateHash).not.toBe(result.state);
    expect(attempt!.browserHash).not.toBe(result.browser);
  });

  it.each(['browser', 'state', 'expired'])('rejeita callback com %s inválido antes de trocar código', async (kind) => {
    const result = await start();
    if (kind === 'expired') attempt!.expiresAt = new Date(0);
    await expect(service.finish('code', kind === 'state' ? 'f'.repeat(64) : result.state, kind === 'browser' ? 'f'.repeat(64) : result.browser)).rejects.toThrow();
    expect(oauth.exchange).not.toHaveBeenCalled();
  });

  it('valida token para o cliente correto e consome a tentativa uma única vez', async () => {
    const result = await start();
    expect(await service.finish('code', result.state, result.browser)).toEqual({ sub: 'google-123', email: 'cliente@example.com', name: 'Cliente' });
    expect(oauth.exchange).toHaveBeenCalledWith({ code: 'code', codeVerifier: 'pkce-secret' });
    expect(oauth.verify).toHaveBeenCalledWith({ idToken: 'signed-token', audience: 'client-test' });
    await expect(service.finish('code', result.state, result.browser)).rejects.toThrow();
    expect(oauth.exchange).toHaveBeenCalledOnce();
  });

  it.each(['nonce', 'email', 'signature'])('rejeita identidade com %s inválido', async (kind) => {
    const result = await start();
    if (kind === 'signature') oauth.verify.mockRejectedValue(new Error('invalid signature'));
    else oauth.verify.mockResolvedValue({ getPayload: () => ({ sub: '123', email: 'test@example.com', email_verified: kind !== 'email', nonce: kind === 'nonce' ? 'wrong' : result.nonce }) });
    await expect(service.finish('code', result.state, result.browser)).rejects.toThrow();
  });

  const identity = { sub: 'google-123', email: 'cliente@example.com', name: 'Cliente' };
  it('cria apenas cliente Google, sem senha artificial', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 1, name: 'Cliente', email: identity.email, username: null, role: 'CLIENTE' });
    const auth = new AuthService(prisma);
    expect((await auth.loginWithGoogle(identity)).user.role).toBe('CLIENTE');
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: { name: identity.name, email: identity.email, googleSub: identity.sub, role: 'CLIENTE' } }));
  });

  it('não vincula conta local com e-mail igual e não cria sessão', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 99, role: 'ADMIN' });
    await expect(new AuthService(prisma).loginWithGoogle(identity)).rejects.toThrow('Entre com sua senha');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('reconhece retorno pelo sub estável, mesmo após mudança de e-mail', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, name: 'Cliente', email: 'antigo@example.com', username: null, role: 'CLIENTE' });
    const session = await new AuthService(prisma).loginWithGoogle(identity);
    expect(session.user.id).toBe(5);
    expect(prisma.user.findUnique).toHaveBeenCalledOnce();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
