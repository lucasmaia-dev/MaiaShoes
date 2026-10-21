import { Test } from '@nestjs/testing';
import { UnauthorizedException, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { AuthService } from '../src/auth/auth.service.js';
import { configureApp } from '../src/configure-app.js';
import { Prisma } from '../src/generated/prisma/client.js';

const csrf = ['X-MaiaShoes-Request', '1'] as const;
const client = {
  id: 42,
  name: 'Cliente Teste',
  username: null,
  email: 'privado@example.com',
  role: 'CLIENTE',
};
const admin = { ...client, id: 7, role: 'ADMIN' };
const cookie = (role = 'client') => `maiashoes_session=${role}`;
const review = {
  kind: 'AVALIACAO',
  message: 'Gostei da experiência e recomendo conhecer a loja.',
  rating: 4,
  publishConsent: true,
};
const record = {
  id: 10,
  userId: client.id,
  authorName: 'Cliente',
  ...review,
  status: 'PENDENTE',
  updatedAt: new Date(),
};

describe('Participações de clientes (permissões, privacidade e moderação)', () => {
  let app: INestApplication;
  const feedback = {
    findMany: vi.fn(),
    aggregate: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  };
  beforeEach(async () => {
    Object.values(feedback).forEach((mock) => mock.mockReset());
    feedback.findMany.mockResolvedValue([]);
    feedback.aggregate.mockResolvedValue({ _count: 0, _avg: { rating: null } });
    feedback.findUnique.mockResolvedValue(record);
    feedback.upsert.mockResolvedValue(record);
    feedback.update.mockResolvedValue({ ...record, status: 'APROVADO' });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ feedback })
      .overrideProvider(AuthService)
      .useValue({
        authenticate: (token: string) => {
          if (token === 'client') return Promise.resolve(client);
          if (token === 'admin') return Promise.resolve(admin);
          throw new UnauthorizedException();
        },
      })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  it('consulta pública mostra apenas avaliações aprovadas, com consentimento e sem dados da conta', async () => {
    await request(app.getHttpServer())
      .get('/api/feedback')
      .expect(200)
      .expect({ items: [], summary: { count: 0, average: null } });
    const options = feedback.findMany.mock.calls[0][0];
    expect(options.where).toEqual({
      kind: 'AVALIACAO',
      status: 'APROVADO',
      publishConsent: true,
    });
    expect(Object.keys(options.select)).toEqual([
      'id',
      'authorName',
      'message',
      'rating',
      'updatedAt',
    ]);
    expect(options.take).toBe(12);
  });
  it.each(['/api/feedback/mine', '/api/feedback/moderation'])(
    'protege %s sem sessão',
    async (path) => {
      await request(app.getHttpServer()).get(path).expect(401);
      expect(feedback.findMany).not.toHaveBeenCalled();
    },
  );
  it('cliente não pode abrir a lista administrativa', async () => {
    await request(app.getHttpServer())
      .get('/api/feedback/moderation')
      .set('Cookie', cookie())
      .expect(403);
    expect(feedback.findMany).not.toHaveBeenCalled();
  });
  it('lista pessoal fica restrita ao autor autenticado', async () => {
    await request(app.getHttpServer())
      .get('/api/feedback/mine')
      .set('Cookie', cookie())
      .expect(200);
    expect(feedback.findMany.mock.calls[0][0].where).toEqual({
      userId: client.id,
    });
  });
  it('não aceita envio sem cabeçalho de proteção ou sessão', async () => {
    await request(app.getHttpServer())
      .put('/api/feedback')
      .set('Cookie', cookie())
      .send(review)
      .expect(403);
    await request(app.getHttpServer())
      .put('/api/feedback')
      .set(...csrf)
      .send(review)
      .expect(401);
    expect(feedback.upsert).not.toHaveBeenCalled();
  });
  it.each([
    { rating: 0 },
    { rating: 6 },
    { rating: undefined },
    { rating: '5' },
    { message: 'curto' },
    { message: ' '.repeat(30) },
    { message: 'a'.repeat(1001) },
    { status: 'APROVADO' },
    { userId: 7 },
    { publishConsent: false },
  ])(
    'rejeita avaliação inválida ou tentativa de forjar campos: %j',
    async (change) => {
      await request(app.getHttpServer())
        .put('/api/feedback')
        .set(...csrf)
        .set('Cookie', cookie())
        .send({ ...review, ...change })
        .expect(400);
      expect(feedback.upsert).not.toHaveBeenCalled();
    },
  );
  it('novo envio e edição ficam pendentes e usam somente o primeiro nome', async () => {
    await request(app.getHttpServer())
      .put('/api/feedback')
      .set(...csrf)
      .set('Cookie', cookie())
      .send(review)
      .expect(200);
    const options = feedback.upsert.mock.calls[0][0];
    expect(options.where).toEqual({
      userId_kind: { userId: client.id, kind: 'AVALIACAO' },
    });
    expect(options.update).toMatchObject({
      status: 'PENDENTE',
      moderatedAt: null,
      moderatedById: null,
      authorName: 'Cliente',
      publishConsent: true,
    });
    expect(options.create.userId).toBe(client.id);
  });
  it('sugestão permanece privada mesmo quando o cliente envia consentimento', async () => {
    await request(app.getHttpServer())
      .put('/api/feedback')
      .set(...csrf)
      .set('Cookie', cookie())
      .send({ kind: 'SUGESTAO', message: review.message, publishConsent: true })
      .expect(200);
    expect(feedback.upsert.mock.calls[0][0].create).toMatchObject({
      kind: 'SUGESTAO',
      rating: null,
      publishConsent: false,
      status: 'PENDENTE',
    });
  });
  it('administrador não envia depoimento como cliente', async () => {
    await request(app.getHttpServer())
      .put('/api/feedback')
      .set(...csrf)
      .set('Cookie', cookie('admin'))
      .send(review)
      .expect(403);
  });
  it('cliente não pode aprovar a própria avaliação', async () => {
    await request(app.getHttpServer())
      .patch('/api/feedback/10/status')
      .set(...csrf)
      .set('Cookie', cookie())
      .send({ status: 'APROVADO', updatedAt: record.updatedAt.toISOString() })
      .expect(403);
    expect(feedback.update).not.toHaveBeenCalled();
  });
  it('somente administrador publica, registrando responsável e data', async () => {
    await request(app.getHttpServer())
      .patch('/api/feedback/10/status')
      .set(...csrf)
      .set('Cookie', cookie('admin'))
      .send({ status: 'APROVADO', updatedAt: record.updatedAt.toISOString() })
      .expect(200);
    expect(feedback.update.mock.calls[0][0].data).toMatchObject({
      status: 'APROVADO',
      moderatedById: admin.id,
    });
    expect(feedback.update.mock.calls[0][0].data.moderatedAt).toBeInstanceOf(
      Date,
    );
  });
  it('não publica sugestão privada ou avaliação sem autorização', async () => {
    for (const value of [
      { ...record, kind: 'SUGESTAO' },
      { ...record, publishConsent: false },
    ]) {
      feedback.findUnique.mockResolvedValue(value);
      await request(app.getHttpServer())
        .patch('/api/feedback/10/status')
        .set(...csrf)
        .set('Cookie', cookie('admin'))
        .send({ status: 'APROVADO', updatedAt: record.updatedAt.toISOString() })
        .expect(400);
    }
    expect(feedback.update).not.toHaveBeenCalled();
  });
  it('retorna 404 para participação inexistente', async () => {
    feedback.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer())
      .patch('/api/feedback/999/status')
      .set(...csrf)
      .set('Cookie', cookie('admin'))
      .send({ status: 'ARQUIVADO', updatedAt: record.updatedAt.toISOString() })
      .expect(404);
  });

  it('impede publicar um texto editado depois de o administrador abrir a lista', async () => {
    feedback.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Alterado', {
        code: 'P2025',
        clientVersion: '7.10.1',
      }),
    );
    await request(app.getHttpServer())
      .patch('/api/feedback/10/status')
      .set(...csrf)
      .set('Cookie', cookie('admin'))
      .send({ status: 'APROVADO', updatedAt: record.updatedAt.toISOString() })
      .expect(409);
    expect(feedback.update.mock.calls[0][0].where).toEqual({
      id: 10,
      updatedAt: record.updatedAt,
    });
  });
});
