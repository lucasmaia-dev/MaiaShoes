import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { Prisma } from '../src/generated/prisma/client.js';

describe('Produtos (HTTP)', () => {
  let app: INestApplication;
  const create = vi.fn();
  const findMany = vi.fn();
  const update = vi.fn();
  const record = {
    id: 1, name: 'Tênis Essencial', description: null, imageUrl: null,
    price: new Prisma.Decimal('189.90'),
    createdAt: new Date('2026-10-16T12:00:00.000Z'),
    updatedAt: new Date('2026-10-16T12:00:00.000Z'),
  };

  beforeEach(async () => {
    create.mockReset().mockResolvedValue(record);
    findMany.mockReset().mockResolvedValue([record]);
    update.mockReset().mockResolvedValue({ ...record, imageUrl: '/products/foto-001.jpeg' });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ product: { create, findMany, update } })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('cadastra com HTTP 201, remove espaços do nome e preserva centavos', async () => {
    const response = await request(app.getHttpServer()).post('/api/products')
      .send({ name: '  Tênis Essencial  ', price: '189.90' }).expect(201);
    expect(response.body).toEqual({
      ...record, price: '189.90',
      createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(),
    });
    expect(create).toHaveBeenCalledWith({
      data: { name: 'Tênis Essencial', price: '189.90', description: undefined, imageUrl: undefined },
    });
  });

  it.each([
    { name: '   ', price: '189.90' },
    { name: 'Tênis', price: '-1.00' },
    { name: 'Tênis', price: '10.999' },
    { name: 'Tênis', price: '189,90' },
    { name: 'Tênis', price: '100000000.00' },
    { name: 'Tênis', price: 189.9 },
    { name: 'Tênis' },
    { name: 'Tênis', price: '189.90', id: 999 },
    { name: 'Tênis', price: '189.90', description: 123 },
  ])('rejeita entrada inválida antes de gravar: %j', async (body) => {
    await request(app.getHttpServer()).post('/api/products').send(body).expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('lista os produtos com preço decimal em texto', async () => {
    const response = await request(app.getHttpServer()).get('/api/products').expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: 1, price: '189.90' });
    expect(findMany).toHaveBeenCalledWith({ orderBy: { id: 'desc' } });
  });

  it('retorna lista vazia quando não há produtos', async () => {
    findMany.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/api/products').expect(200).expect([]);
  });

  it('aceita uma foto importada no novo cadastro', async () => {
    await request(app.getHttpServer()).post('/api/products')
      .send({ name: 'Tênis', price: '189.90', imageUrl: '/products/foto-001.jpeg' }).expect(201);
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ imageUrl: '/products/foto-001.jpeg' }) });
  });

  it.each(['https://example.com/foto.jpg', '/products/inexistente.jpeg', '../.env', ''])('rejeita imagem não importada: %s', async (imageUrl) => {
    await request(app.getHttpServer()).post('/api/products').send({ name: 'Tênis', price: '10.00', imageUrl }).expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('altera só a foto de um produto existente', async () => {
    await request(app.getHttpServer()).patch('/api/products/1/image')
      .send({ imageUrl: '/products/foto-001.jpeg' }).expect(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 1 }, data: { imageUrl: '/products/foto-001.jpeg' } });
  });

  it('permite remover a foto sem apagar o produto', async () => {
    update.mockResolvedValue(record);
    const response = await request(app.getHttpServer()).patch('/api/products/1/image').send({ imageUrl: null }).expect(200);
    expect(response.body.imageUrl).toBeNull();
    expect(update).toHaveBeenCalledWith({ where: { id: 1 }, data: { imageUrl: null } });
  });

  it.each([{}, { imageUrl: '/products/inexistente.jpeg' }, { imageUrl: null, price: '0.00' }])('rejeita atualização inválida: %j', async (body) => {
    await request(app.getHttpServer()).patch('/api/products/1/image').send(body).expect(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('retorna 404 se o produto não existir', async () => {
    update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Missing', { code: 'P2025', clientVersion: '7.10.1' }));
    await request(app.getHttpServer()).patch('/api/products/999/image').send({ imageUrl: null }).expect(404);
  });

  it('rejeita identificador que não é um número', async () => {
    await request(app.getHttpServer()).patch('/api/products/abc/image').send({ imageUrl: null }).expect(400);
    expect(update).not.toHaveBeenCalled();
  });
});
