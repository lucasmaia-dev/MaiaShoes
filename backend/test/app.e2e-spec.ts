import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/database/prisma.service.js';
import { configureApp } from './../src/configure-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const checkConnection = vi.fn();

  beforeEach(async () => {
    checkConnection.mockReset();
    checkConnection.mockResolvedValue({ status: 'ok', database: 'postgresql', products: 0 });
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /api/health retorna o estado da API em JSON', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'ok', application: 'MaiaShoes API' });
  });

  it('GET /api/health/database confirma a conexão e a tabela', async () => {
    await request(app.getHttpServer())
      .get('/api/health/database')
      .expect(200)
      .expect({ status: 'ok', database: 'postgresql', products: 0 });
  });

  it('retorna 503 sem expor os detalhes de conexão se o banco falhar', async () => {
    checkConnection.mockRejectedValue(new Error('detalhe privado da conexão'));
    const response = await request(app.getHttpServer())
      .get('/api/health/database')
      .expect(503);
    expect(response.body.message).toBe('Banco de dados indisponível.');
    expect(JSON.stringify(response.body)).not.toContain('detalhe privado');
  });

  afterEach(async () => {
    await app.close();
  });
});
