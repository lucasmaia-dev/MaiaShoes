import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/auth/password.js';
import { GoogleService } from '../src/auth/google.service.js';

type User = { id: number; name: string; username: string | null; email: string | null; googleSub?: string | null; role: 'ADMIN' | 'CLIENTE'; passwordHash: string | null };
type Session = { tokenHash: string; userId: number; expiresAt: Date };
const password = 'Senha-de-teste-12345!';
const csrf = ['X-MaiaShoes-Request', '1'] as const;
const publicUser = ({ id, name, username = null, email = null, role }: User) => ({ id, name, username, email, role });
const cookie = (response: request.Response) => response.headers['set-cookie'][0].split(';')[0] as string;

describe('Autenticação e permissões (guards reais)', () => {
  let app: INestApplication;
  let passwordHash: string;
  let users: User[];
  let sessions: Map<string, Session>;
  const createProduct = vi.fn();

  beforeAll(async () => { passwordHash = await hashPassword(password); });
  beforeEach(async () => {
    users = [
      { id: 100, name: 'Administrador', username: 'admin_teste', email: null, role: 'ADMIN', passwordHash },
      { id: 101, name: 'Cliente', username: 'cliente_teste', email: 'cliente@example.com', role: 'CLIENTE', passwordHash },
    ];
    sessions = new Map();
    createProduct.mockReset().mockResolvedValue({ id: 1, name: 'Tênis', price: new Prisma.Decimal('10'), description: null, imageUrl: null, category: 'TENIS', createdAt: new Date(), updatedAt: new Date() });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({
        user: {
          findUnique: ({ where }: { where: Partial<User> }) => Promise.resolve(users.find((user) => Object.entries(where).every(([key, value]) => user[key as keyof User] === value)) ?? null),
          create: ({ data }: { data: Omit<User, 'id'> }) => {
            if (users.some((user) => user.email === data.email)) throw new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: '7.10.1' });
            const user = { ...data, id: users.length + 100 }; users.push(user); return Promise.resolve(publicUser(user));
          },
        },
        session: {
          create: ({ data }: { data: Session }) => { sessions.set(data.tokenHash, data); return Promise.resolve(data); },
          findUnique: ({ where }: { where: { tokenHash: string } }) => {
            const session = sessions.get(where.tokenHash);
            return Promise.resolve(session ? { ...session, user: publicUser(users.find((user) => user.id === session.userId)!) } : null);
          },
          deleteMany: ({ where }: { where: { tokenHash: string } }) => { sessions.delete(where.tokenHash); return Promise.resolve({ count: 1 }); },
        },
        product: { findMany: () => Promise.resolve([]), create: createProduct },
      }).compile();
    app = module.createNestApplication(); configureApp(app); await app.init();
  });
  afterEach(async () => { await app.close(); });

  async function login(username = 'admin_teste') {
    return request(app.getHttpServer()).post('/api/auth/login').set(...csrf).send({ username, password }).expect(200);
  }

  it('mantém a listagem pública e exige login para cadastrar', async () => {
    await request(app.getHttpServer()).get('/api/products').expect(200).expect([]);
    await request(app.getHttpServer()).post('/api/products').set(...csrf).send({ name: 'Tênis', price: '10.00' }).expect(401);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('cria apenas cliente, normaliza o usuário e não expõe senha ou token', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/register').set(...csrf)
      .send({ name: ' Novo Cliente ', email: ' Novo.Cliente@EXAMPLE.COM ', password }).expect(201);
    expect(response.body).toEqual({ id: 102, name: 'Novo Cliente', username: null, email: 'novo.cliente@example.com', role: 'CLIENTE' });
    expect(users[2].passwordHash).not.toBe(password);
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    const rawToken = cookie(response).split('=')[1];
    expect(sessions.has(rawToken)).toBe(false);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie(response)).expect(200).expect(response.body);
  });

  it('impede elevação de privilégio pelo cadastro', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').set(...csrf)
      .send({ name: 'Novo', email: 'novo@example.com', password, role: 'ADMIN' }).expect(400);
    expect(users).toHaveLength(2);
  });

  it.each(['123', ' '.repeat(14), 'sem-maiuscula-123!', 'SemNumeroAqui!!!', 'SemSimbolo123456', 'Senha Com Espaco123'])('rejeita senha fraca no cadastro público: %j', async (weak) => {
    await request(app.getHttpServer()).post('/api/auth/register').set(...csrf)
      .send({ name: 'Novo', email: 'novo@example.com', password: weak }).expect(400);
    expect(users).toHaveLength(2);
  });

  it('não permite duplicar usuário existente', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').set(...csrf)
      .send({ name: 'Novo', email: 'CLIENTE@EXAMPLE.COM', password }).expect(409);
  });

  it('aceita e-mail normalizado no login com senha', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/login').set(...csrf)
      .send({ username: ' CLIENTE@EXAMPLE.COM ', password }).expect(200);
    expect(response.body.id).toBe(101);
    expect(response.body.email).toBe('cliente@example.com');
  });

  it('conta criada apenas com Google não aceita login por senha', async () => {
    users.push({ id: 102, name: 'Google', username: null, email: 'google@example.com', googleSub: '123', passwordHash: null, role: 'CLIENTE' });
    await request(app.getHttpServer()).post('/api/auth/login').set(...csrf)
      .send({ username: 'google@example.com', password }).expect(401);
    expect(sessions.size).toBe(0);
  });

  it.each(['invalido', '', 'nome@'])('recusa e-mail inválido no cadastro: %j', async (email) => {
    await request(app.getHttpServer()).post('/api/auth/register').set(...csrf).send({ name: 'Cliente', email, password }).expect(400);
    expect(users).toHaveLength(2);
  });

  it('callback Google cria cookie de sessão e redireciona cliente', async () => {
    vi.spyOn(app.get(GoogleService), 'finish').mockResolvedValue({ sub: 'google-new', email: 'google@example.com', name: 'Google Cliente' });
    const response = await request(app.getHttpServer()).get('/api/auth/google/callback?code=test&state=test').expect(302);
    expect(response.headers.location).toBe('/conta');
    expect(response.headers['set-cookie'].some((value: string) => value.startsWith('maiashoes_session=') && value.includes('HttpOnly'))).toBe(true);
    expect(users[2].role).toBe('CLIENTE');
  });

  it('início Google define cookie HttpOnly e nunca expõe segredo no status', async () => {
    const google = app.get(GoogleService);
    vi.spyOn(google, 'configuration').mockReturnValue({ clientId: 'test', clientSecret: 'secret-test', origin: 'http://localhost:3000', redirectUri: 'http://localhost:3000/api/auth/google/callback' });
    vi.spyOn(google, 'start').mockResolvedValue({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=test', browser: 'a'.repeat(64) });
    const status = await request(app.getHttpServer()).get('/api/auth/google/status').expect(200);
    expect(status.body).toEqual({ enabled: true, startUrl: 'http://localhost:3000/api/auth/google/start' });
    const response = await request(app.getHttpServer()).get('/api/auth/google/start').expect(302);
    expect(response.headers.location).toContain('https://accounts.google.com/');
    expect(response.headers['set-cookie'][0]).toMatch(/maiashoes_google=.*HttpOnly/);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('callback inválida não cria sessão nem expõe detalhes de erro', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/google/callback?code=bad&state=bad').expect(302);
    expect(response.headers.location).toBe('/login?google=failed');
    expect(sessions.size).toBe(0);
  });

  it.each(['admin_teste', 'nao_existe'])('usa erro genérico para credenciais incorretas: %s', async (username) => {
    const response = await request(app.getHttpServer()).post('/api/auth/login').set(...csrf).send({ username, password: 'errada' }).expect(401);
    expect(response.body.message).toBe('Usuário ou senha inválidos.');
    expect(sessions.size).toBe(0);
  });

  it('permite cadastro de produto apenas ao administrador', async () => {
    const response = await login();
    await request(app.getHttpServer()).post('/api/products').set(...csrf).set('Cookie', cookie(response))
      .send({ name: 'Tênis', price: '10.00', category: 'TENIS' }).expect(201);
    expect(createProduct).toHaveBeenCalledOnce();
  });

  it.each(['/api/products', '/api/products/1/image', '/api/products/1/category'])('bloqueia cliente na escrita: %s', async (path) => {
    const response = await login('cliente_teste');
    const call = path === '/api/products' ? request(app.getHttpServer()).post(path) : request(app.getHttpServer()).patch(path);
    await call.set(...csrf).set('Cookie', cookie(response)).send({}).expect(403);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('rejeita alteração sem o cabeçalho de proteção CSRF', async () => {
    const response = await login();
    await request(app.getHttpServer()).post('/api/products').set('Cookie', cookie(response)).send({}).expect(403);
  });

  it('revoga a sessão no logout', async () => {
    const response = await login();
    await request(app.getHttpServer()).post('/api/auth/logout').set(...csrf).set('Cookie', cookie(response)).expect(204);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie(response)).expect(401);
    expect(sessions.size).toBe(0);
  });

  it('rejeita sessões expiradas ou adulteradas', async () => {
    const response = await login();
    for (const session of sessions.values()) session.expiresAt = new Date(0);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie(response)).expect(401);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', 'maiashoes_session=invalido').expect(401);
  });

  it('limita tentativas de login', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app.getHttpServer()).post('/api/auth/login').set(...csrf).send({ username: 'admin_teste', password: 'errada' }).expect(401);
    }
    await request(app.getHttpServer()).post('/api/auth/login').set(...csrf).send({ username: 'admin_teste', password: 'errada' }).expect(429);
  }, 30000);
});
