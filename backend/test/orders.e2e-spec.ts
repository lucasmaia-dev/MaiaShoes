import { Test } from '@nestjs/testing';
import { UnauthorizedException, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { AuthService } from '../src/auth/auth.service.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { configureApp } from '../src/configure-app.js';

const csrf = ['X-MaiaShoes-Request', '1'] as const;
const input = {
  requestId: '80ad8f34-ef48-4c3f-9552-6ec3a7d0feec',
  productId: 5,
  quantity: 2,
  line: 'FEMININO',
  size: 36,
  fulfillment: 'RETIRADA',
  contact: '(62) 99999-9999',
};
const saved = {
  id: 'cmtestorder12345678901234',
  userId: 42,
  status: 'AGUARDANDO_CONFIRMACAO',
  fulfillment: 'A_COMBINAR',
  fulfillmentViaWhatsapp: true,
  pixPayload: null,
  unitPriceCents: 16000,
  quantity: 1,
};

describe('Pix imediato com retirada gratuita ou entrega incluída', () => {
  let app: INestApplication;
  const orders = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  };
  const product = { findUnique: vi.fn() };
  const progressEvent = { create: vi.fn() };
  beforeEach(async () => {
    Object.values(orders).forEach((mock) => mock.mockReset());
    product.findUnique.mockReset();
    progressEvent.create.mockReset();
    progressEvent.create.mockResolvedValue({ id: 'event-test' });
    orders.findUnique.mockResolvedValue(null);
    orders.findMany.mockResolvedValue([]);
    orders.create.mockResolvedValue({ id: saved.id });
    orders.updateMany.mockResolvedValue({ count: 1 });
    product.findUnique.mockResolvedValue({
      id: 5,
      name: 'Tênis teste',
      category: 'TENIS',
      imageUrl: '/products/foto-001.jpeg',
      price: new Prisma.Decimal('200.01'),
    });
    vi.stubEnv('PIX_KEY', 'teste@example.com');
    vi.stubEnv('PIX_RECEIVER', 'Loja Teste');
    vi.stubEnv('PIX_CITY', 'Anápolis');
    vi.stubEnv('STORE_WHATSAPP', '5562999999999');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        order: orders,
        product,
        $transaction: (callback: (tx: unknown) => unknown) =>
          callback({ order: orders, orderProgressEvent: progressEvent }),
      })
      .overrideProvider(AuthService)
      .useValue({
        authenticate: (token: string) => {
          if (!['client', 'admin'].includes(token))
            throw new UnauthorizedException();
          return Promise.resolve({
            id: token === 'admin' ? 7 : 42,
            role: token === 'admin' ? 'ADMIN' : 'CLIENTE',
            name: 'Teste',
          });
        },
      })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });
  const send = (data: object = input) =>
    request(app.getHttpServer())
      .post('/api/orders')
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send(data);
  const choose = (data: object = { fulfillment: 'ENTREGA' }) =>
    request(app.getHttpServer())
      .patch(`/api/orders/${saved.id}/fulfillment`)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send(data);

  it('exige sessão e CSRF', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .set(...csrf)
      .send(input)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', 'maiashoes_session=client')
      .send(input)
      .expect(403);
    expect(orders.create).not.toHaveBeenCalled();
  });
  it('libera Pix na criação sem aprovação e sem taxa na retirada', async () => {
    await send().expect(201);
    const data = orders.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      userId: 42,
      unitPriceCents: 20001,
      quantity: 2,
      shippingCents: 0,
      totalCents: 40002,
      status: 'AGUARDANDO_PAGAMENTO',
      fulfillmentViaWhatsapp: false,
    });
    expect(data.pixPayload).toContain('5406400.02');
    expect(data.id).toMatch(/^[a-f0-9]{24}$/);
    expect(data.pixPayload).toContain(data.id);
    expect(data).not.toHaveProperty('paidAt');
    expect(orders.updateMany).not.toHaveBeenCalled();
  });
  it.each([1, 2])(
    'cobra entrega uma única vez no mesmo Pix para %s unidade(s)',
    async (quantity) => {
      product.findUnique.mockResolvedValue({
        id: 5,
        name: 'Samba',
        category: 'TENIS',
        imageUrl: '/products/foto-001.jpeg',
        price: new Prisma.Decimal('160.00'),
      });
      await send({ ...input, fulfillment: 'ENTREGA', quantity }).expect(201);
      const data = orders.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        shippingCents: 1500,
        totalCents: 16000 * quantity + 1500,
        status: 'AGUARDANDO_PAGAMENTO',
        address: null,
      });
      expect(data.pixPayload).toContain(
        quantity === 1 ? '5406175.00' : '5406335.00',
      );
    },
  );
  it.each([
    { ...input, price: 1 },
    { ...input, shippingCents: 0 },
    { ...input, totalCents: 1 },
    { ...input, fulfillment: 'A_COMBINAR' },
    { ...input, fulfillment: null },
    { ...input, size: 43 },
    { ...input, size: undefined },
    { ...input, quantity: 0 },
  ])(
    'rejeita manipulação de preço, frete, tamanho ou recebimento ausente',
    async (data) => {
      await send(data).expect(400);
      expect(orders.create).not.toHaveBeenCalled();
    },
  );
  it('não salva pedido sem Pix configurado', async () => {
    vi.stubEnv('PIX_KEY', '');
    await send().expect(503);
    expect(orders.create).not.toHaveBeenCalled();
  });
  it('reenviar o UUID devolve o mesmo pedido sem gerar outra cobrança', async () => {
    orders.findUnique.mockResolvedValue(saved);
    await send().expect(201).expect({ id: saved.id });
    expect(orders.create).not.toHaveBeenCalled();
    orders.findUnique.mockResolvedValue({ ...saved, userId: 99 });
    await send().expect(409);
  });
  it('detalhe exige o dono e gera QR somente para Pix pendente', async () => {
    orders.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer())
      .get(`/api/orders/${saved.id}`)
      .set('Cookie', 'maiashoes_session=client')
      .expect(404);
    expect(orders.findFirst.mock.calls[0][0].where).toEqual({
      id: saved.id,
      userId: 42,
    });
    orders.findFirst.mockResolvedValue({
      ...saved,
      status: 'AGUARDANDO_PAGAMENTO',
      pixPayload: 'teste',
    });
    const result = await request(app.getHttpServer())
      .get(`/api/orders/${saved.id}`)
      .set('Cookie', 'maiashoes_session=client')
      .expect(200);
    expect(result.body.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(result.headers['cache-control']).toBe('no-store');
  });
  it('pedido antigo sem Pix pode escolher entrega e gerar R$175 imediatamente', async () => {
    orders.findFirst.mockResolvedValue(saved);
    await choose().expect(200);
    expect(orders.updateMany.mock.calls[0][0]).toMatchObject({
      where: {
        id: saved.id,
        userId: 42,
        status: 'AGUARDANDO_CONFIRMACAO',
        pixPayload: null,
      },
      data: {
        fulfillment: 'ENTREGA',
        shippingCents: 1500,
        totalCents: 17500,
        status: 'AGUARDANDO_PAGAMENTO',
        fulfillmentViaWhatsapp: false,
      },
    });
    expect(orders.updateMany.mock.calls[0][0].data.pixPayload).toContain(
      '5406175.00',
    );
  });
  it('pedido antigo sem Pix pode escolher retirada sem taxa', async () => {
    orders.findFirst.mockResolvedValue(saved);
    await choose({ fulfillment: 'RETIRADA' }).expect(200);
    expect(orders.updateMany.mock.calls[0][0].data).toMatchObject({
      shippingCents: 0,
      totalCents: 16000,
    });
  });
  it.each([
    { ...saved, status: 'AGUARDANDO_PAGAMENTO', pixPayload: 'emitido' },
    { ...saved, status: 'PAGO', pixPayload: 'emitido' },
    { ...saved, pixPayload: 'emitido' },
  ])(
    'não troca forma de recebimento nem valores após emitir Pix',
    async (record) => {
      orders.findFirst.mockResolvedValue(record);
      await choose().expect(409);
      expect(orders.updateMany).not.toHaveBeenCalled();
    },
  );
  it('não altera pedidos de terceiros e protege escolha com sessão, CSRF e validação', async () => {
    orders.findFirst.mockResolvedValue(null);
    await choose().expect(404);
    const path = `/api/orders/${saved.id}/fulfillment`;
    await request(app.getHttpServer())
      .patch(path)
      .set(...csrf)
      .send({ fulfillment: 'ENTREGA' })
      .expect(401);
    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', 'maiashoes_session=client')
      .send({ fulfillment: 'ENTREGA' })
      .expect(403);
    await choose({ fulfillment: 'ENTREGA', status: 'PAGO' }).expect(400);
    expect(orders.updateMany).not.toHaveBeenCalled();
  });
  it('conflito simultâneo não sobrescreve uma cobrança emitida', async () => {
    orders.findFirst.mockResolvedValue(saved);
    orders.updateMany.mockResolvedValue({ count: 0 });
    await choose().expect(409);
  });
  it('somente administrador confirma recebimento com referência bancária', async () => {
    const path = `/api/orders/${saved.id}/payment`;
    await request(app.getHttpServer())
      .patch(path)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send({ bankReference: 'E123456TESTE' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(path)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=admin')
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .patch(path)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=admin')
      .send({ bankReference: 'E123456TESTE' })
      .expect(200);
    expect(orders.updateMany.mock.calls[0][0]).toMatchObject({
      where: { status: 'AGUARDANDO_PAGAMENTO' },
      data: { status: 'PAGO', confirmedById: 7, bankReference: 'E123456TESTE' },
    });
  });
  it('carrinho soma todas as peças e cobra uma única entrega no Pix', async () => {
    product.findUnique.mockImplementation(({ where }) =>
      Promise.resolve({
        id: where.id,
        name: where.id === 5 ? 'Tênis' : 'Bolsa',
        category: where.id === 5 ? 'TENIS' : 'BOLSAS',
        imageUrl: '/products/foto-001.jpeg',
        price: new Prisma.Decimal(where.id === 5 ? '200.01' : '160.50'),
      }),
    );
    await request(app.getHttpServer())
      .post('/api/orders/cart')
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send({
        requestId: input.requestId,
        contact: input.contact,
        fulfillment: 'ENTREGA',
        items: [
          { productId: 5, quantity: 2, line: 'FEMININO', size: 36 },
          { productId: 6, quantity: 1 },
        ],
      })
      .expect(201);
    const data = orders.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      subtotalCents: 56052,
      shippingCents: 1500,
      totalCents: 57552,
      status: 'AGUARDANDO_PAGAMENTO',
    });
    expect(data.items.create).toMatchObject([
      {
        productId: 5,
        quantity: 2,
        size: 36,
        unitPriceCents: 20001,
        position: 0,
      },
      {
        productId: 6,
        quantity: 1,
        size: null,
        line: null,
        unitPriceCents: 16050,
        position: 1,
      },
    ]);
    expect(data.pixPayload).toContain('5406575.52');
  });
  it.each([
    [],
    [{ productId: 5, quantity: 1 }],
    [{ productId: 5, quantity: 11, line: 'FEMININO', size: 36 }],
    [
      {
        productId: 5,
        quantity: 1,
        line: 'FEMININO',
        size: 36,
        unitPriceCents: 1,
      },
    ],
    [
      { productId: 5, quantity: 1, line: 'FEMININO', size: 36 },
      { productId: 5, quantity: 1, line: 'FEMININO', size: 36 },
    ],
    Array.from({ length: 21 }, (_, index) => ({
      productId: index + 1,
      quantity: 1,
    })),
  ])(
    'carrinho rejeita itens inválidos, duplicados ou preço do navegador',
    async (items) => {
      await request(app.getHttpServer())
        .post('/api/orders/cart')
        .set(...csrf)
        .set('Cookie', 'maiashoes_session=client')
        .send({
          requestId: input.requestId,
          contact: input.contact,
          fulfillment: 'ENTREGA',
          items,
        })
        .expect(400);
      expect(orders.create).not.toHaveBeenCalled();
    },
  );
  it('não cria parte de um carrinho quando uma peça não existe', async () => {
    product.findUnique
      .mockResolvedValueOnce({
        id: 5,
        name: 'Tênis',
        category: 'TENIS',
        imageUrl: '/products/foto-001.jpeg',
        price: new Prisma.Decimal('200'),
      })
      .mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .post('/api/orders/cart')
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send({
        requestId: input.requestId,
        contact: input.contact,
        fulfillment: 'RETIRADA',
        items: [
          { productId: 5, quantity: 1, line: 'FEMININO', size: 36 },
          { productId: 6, quantity: 1 },
        ],
      })
      .expect(400);
    expect(orders.create).not.toHaveBeenCalled();
  });
  it('carrinho repetido não duplica pedido e exige sessão', async () => {
    const body = {
      requestId: input.requestId,
      contact: input.contact,
      fulfillment: 'RETIRADA',
      items: [{ productId: 5, quantity: 1, line: 'FEMININO', size: 36 }],
    };
    orders.findUnique.mockResolvedValue(saved);
    await request(app.getHttpServer())
      .post('/api/orders/cart')
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send(body)
      .expect(201)
      .expect({ id: saved.id });
    await request(app.getHttpServer())
      .post('/api/orders/cart')
      .set(...csrf)
      .send(body)
      .expect(401);
    expect(orders.create).not.toHaveBeenCalled();
  });
  it.each([
    ['ENTREGA', 'PREPARANDO', 'SAIU_PARA_ENTREGA'],
    ['ENTREGA', 'SAIU_PARA_ENTREGA', 'CONCLUIDO'],
    ['RETIRADA', 'PREPARANDO', 'PRONTO_PARA_RETIRADA'],
    ['RETIRADA', 'PRONTO_PARA_RETIRADA', 'CONCLUIDO'],
    ['A_COMBINAR', 'PREPARANDO', 'CONCLUIDO'],
  ])(
    'administrador avança %s de %s para %s com histórico',
    async (fulfillment, expectedStatus, status) => {
      orders.findUnique.mockResolvedValue({
        ...saved,
        status: 'PAGO',
        fulfillment,
        fulfillmentStatus: expectedStatus,
      });
      await request(app.getHttpServer())
        .patch(`/api/orders/${saved.id}/progress`)
        .set(...csrf)
        .set('Cookie', 'maiashoes_session=admin')
        .send({ expectedStatus, status })
        .expect(200);
      expect(orders.updateMany.mock.calls[0][0]).toEqual({
        where: {
          id: saved.id,
          status: 'PAGO',
          fulfillmentStatus: expectedStatus,
        },
        data: { fulfillmentStatus: status },
      });
      expect(progressEvent.create.mock.calls[0][0].data).toEqual({
        orderId: saved.id,
        actorId: 7,
        fromStatus: expectedStatus,
        status,
      });
    },
  );
  it('cliente e requisição sem CSRF não podem avançar etapas', async () => {
    const path = `/api/orders/${saved.id}/progress`;
    const body = { expectedStatus: 'PREPARANDO', status: 'SAIU_PARA_ENTREGA' };
    await request(app.getHttpServer())
      .patch(path)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=client')
      .send(body)
      .expect(403);
    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', 'maiashoes_session=admin')
      .send(body)
      .expect(403);
    expect(orders.updateMany).not.toHaveBeenCalled();
    expect(progressEvent.create).not.toHaveBeenCalled();
  });
  it('não prepara nem entrega pedido sem pagamento confirmado', async () => {
    orders.findUnique.mockResolvedValue({
      ...saved,
      status: 'AGUARDANDO_PAGAMENTO',
      fulfillmentStatus: 'PREPARANDO',
    });
    await request(app.getHttpServer())
      .patch(`/api/orders/${saved.id}/progress`)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=admin')
      .send({ expectedStatus: 'PREPARANDO', status: 'SAIU_PARA_ENTREGA' })
      .expect(409);
    expect(orders.updateMany).not.toHaveBeenCalled();
    expect(progressEvent.create).not.toHaveBeenCalled();
  });
  it.each([
    ['ENTREGA', 'PREPARANDO', 'PRONTO_PARA_RETIRADA'],
    ['RETIRADA', 'PREPARANDO', 'SAIU_PARA_ENTREGA'],
    ['ENTREGA', 'PREPARANDO', 'CONCLUIDO'],
    ['ENTREGA', 'SAIU_PARA_ENTREGA', 'PRONTO_PARA_RETIRADA'],
  ])(
    'rejeita etapa incompatível: %s %s para %s',
    async (fulfillment, expectedStatus, status) => {
      orders.findUnique.mockResolvedValue({
        ...saved,
        status: 'PAGO',
        fulfillment,
        fulfillmentStatus: expectedStatus,
      });
      await request(app.getHttpServer())
        .patch(`/api/orders/${saved.id}/progress`)
        .set(...csrf)
        .set('Cookie', 'maiashoes_session=admin')
        .send({ expectedStatus, status })
        .expect(400);
      expect(orders.updateMany).not.toHaveBeenCalled();
      expect(progressEvent.create).not.toHaveBeenCalled();
    },
  );
  it('atualização concorrente não cria histórico nem sobrescreve outra etapa', async () => {
    orders.findUnique.mockResolvedValue({
      ...saved,
      status: 'PAGO',
      fulfillment: 'ENTREGA',
      fulfillmentStatus: 'PREPARANDO',
    });
    orders.updateMany.mockResolvedValue({ count: 0 });
    await request(app.getHttpServer())
      .patch(`/api/orders/${saved.id}/progress`)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=admin')
      .send({ expectedStatus: 'PREPARANDO', status: 'SAIU_PARA_ENTREGA' })
      .expect(409);
    expect(progressEvent.create).not.toHaveBeenCalled();
  });
  it('pedido concluído ou etapa antiga não pode ser alterado novamente', async () => {
    orders.findUnique.mockResolvedValue({
      ...saved,
      status: 'PAGO',
      fulfillment: 'ENTREGA',
      fulfillmentStatus: 'CONCLUIDO',
    });
    await request(app.getHttpServer())
      .patch(`/api/orders/${saved.id}/progress`)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=admin')
      .send({ expectedStatus: 'SAIU_PARA_ENTREGA', status: 'CONCLUIDO' })
      .expect(409);
    expect(orders.updateMany).not.toHaveBeenCalled();
  });
  it('não reutiliza referência bancária em outro pedido', async () => {
    orders.updateMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await request(app.getHttpServer())
      .patch(`/api/orders/${saved.id}/payment`)
      .set(...csrf)
      .set('Cookie', 'maiashoes_session=admin')
      .send({ bankReference: 'E123456TESTE' })
      .expect(409);
  });
});
