import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { createPixPayload, pixConfig } from './pix.js';
import {
  OWN_DELIVERY_FEE_CENTS,
  requireOrderContact,
  storeWhatsapp,
} from './order-contact.js';
import type {
  ApproveOrderDto,
  ConfirmPaymentDto,
  CreateOrderDto,
  ChooseFulfillmentDto,
  CreateCartOrderDto,
  CartItemDto,
  UpdateOrderProgressDto,
} from './orders.dto.js';

// Dados bancários e identificação de quem conferiu são exclusivos do administrador.
const publicFields = {
  id: true,
  productId: true,
  productName: true,
  imageUrl: true,
  line: true,
  size: true,
  quantity: true,
  unitPriceCents: true,
  subtotalCents: true,
  items: { orderBy: { position: 'asc' as const } },
  shippingCents: true,
  totalCents: true,
  contact: true,
  fulfillment: true,
  fulfillmentViaWhatsapp: true,
  deliveryFeeCents: true,
  address: true,
  status: true,
  fulfillmentStatus: true,
  progressEvents: {
    orderBy: { createdAt: 'asc' as const },
    select: { status: true, createdAt: true },
  },
  pixPayload: true,
  pixReceiver: true,
  paidAt: true,
  createdAt: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: number, input: CreateOrderDto) {
    return this.createCart(
      userId,
      {
        requestId: input.requestId,
        contact: input.contact,
        fulfillment: input.fulfillment,
        items: [
          {
            productId: input.productId,
            quantity: input.quantity,
            line: input.line,
            size: input.size,
          },
        ],
      },
      input.address,
    );
  }

  async createCart(
    userId: number,
    input: CreateCartOrderDto,
    address?: string,
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { requestId: input.requestId },
    });
    if (existing) {
      if (existing.userId !== userId)
        throw new ConflictException('Referência de pedido já utilizada.');
      return { id: existing.id };
    }
    requireOrderContact();
    if (!input.items.length || input.items.length > 20)
      throw new BadRequestException(
        'O carrinho deve conter de 1 a 20 opções de produto.',
      );
    if (input.contact.replace(/\D/g, '').length < 10)
      throw new BadRequestException('Informe um telefone válido.');
    const keys = input.items.map((item) =>
      [item.productId, item.line ?? '', item.size ?? ''].join(':'),
    );
    if (new Set(keys).size !== keys.length)
      throw new BadRequestException(
        'Agrupe a quantidade das peças com o mesmo tamanho e linha.',
      );
    const items = await Promise.all(
      input.items.map((item) => this.snapshotItem(item)),
    );
    const subtotalCents = items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );
    if (
      !Number.isSafeInteger(subtotalCents) ||
      subtotalCents <= 0 ||
      subtotalCents > 999899999
    )
      throw new BadRequestException(
        'O valor do carrinho ultrapassa o limite de pagamento.',
      );
    const first = items[0];
    const id = randomBytes(12).toString('hex');
    const payment = this.paymentData(id, subtotalCents, 1, input.fulfillment);
    try {
      return await this.prisma.order.create({
        data: {
          id,
          requestId: input.requestId,
          userId,
          ...first,
          subtotalCents,
          contact: input.contact.trim(),
          fulfillment: input.fulfillment,
          fulfillmentViaWhatsapp: false,
          deliveryFeeCents: OWN_DELIVERY_FEE_CENTS,
          ...payment,
          address:
            input.fulfillment === 'ENTREGA' ? address?.trim() || null : null,
          items: {
            create: items.map((item, position) => ({ ...item, position })),
          },
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicate = await this.prisma.order.findUnique({
          where: { requestId: input.requestId },
        });
        if (duplicate?.userId === userId) return { id: duplicate.id };
      }
      throw error;
    }
  }

  private async snapshotItem(input: CartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product || !product.imageUrl || product.category === 'SEM_CATEGORIA')
      throw new BadRequestException(
        'Uma peça do carrinho não está mais disponível. Revise sua seleção.',
      );
    const footwear = ['TENIS', 'SAPATOS', 'SANDALIAS'].includes(
      product.category,
    );
    const sizes =
      input.line === 'FEMININO'
        ? [34, 35, 36, 37, 38, 39]
        : [37, 38, 39, 40, 41, 42, 43];
    if (footwear && (!input.line || !input.size || !sizes.includes(input.size)))
      throw new BadRequestException(
        'Escolha uma numeração válida para ' + product.name + '.',
      );
    if (!footwear && (input.line != null || input.size != null))
      throw new BadRequestException(
        'Este produto não utiliza numeração de calçado.',
      );
    const unitPriceCents = Number(product.price.mul(100).toFixed(0));
    if (
      !Number.isSafeInteger(unitPriceCents) ||
      unitPriceCents <= 0 ||
      !Number.isInteger(input.quantity) ||
      input.quantity < 1 ||
      input.quantity > 10
    )
      throw new BadRequestException(
        'Preço ou quantidade indisponível para pagamento.',
      );
    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      line: input.line ?? null,
      size: input.size ?? null,
      quantity: input.quantity,
      unitPriceCents,
    };
  }

  private paymentData(
    id: string,
    unitPriceCents: number,
    quantity: number,
    fulfillment: 'RETIRADA' | 'ENTREGA',
  ) {
    const config = pixConfig();
    const shippingCents =
      fulfillment === 'ENTREGA' ? OWN_DELIVERY_FEE_CENTS : 0;
    const totalCents = unitPriceCents * quantity + shippingCents;
    return {
      status: 'AGUARDANDO_PAGAMENTO' as const,
      shippingCents,
      totalCents,
      pixPayload: createPixPayload(config, totalCents, id),
      pixReceiver: config.receiver,
    };
  }

  mine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      select: publicFields,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async detail(id: string, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      select: publicFields,
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    const qrCode =
      order.status === 'AGUARDANDO_PAGAMENTO' && order.pixPayload
        ? await QRCode.toDataURL(order.pixPayload, {
            width: 320,
            margin: 4,
            errorCorrectionLevel: 'M',
          })
        : null;
    return { ...order, qrCode, whatsappNumber: storeWhatsapp() };
  }

  moderationList() {
    return this.prisma.order.findMany({
      include: {
        progressEvents: {
          orderBy: { createdAt: 'asc' },
          select: { status: true, createdAt: true },
        },
        items: { orderBy: { position: 'asc' } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async approve(id: string, data: ApproveOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (order.status !== 'AGUARDANDO_CONFIRMACAO')
      throw new ConflictException('Este pedido já foi conferido.');
    if (order.fulfillment === 'A_COMBINAR')
      throw new BadRequestException(
        'O cliente deve escolher retirada ou entrega antes de gerar o Pix.',
      );
    const payment = this.paymentData(
      order.id,
      order.subtotalCents ?? order.unitPriceCents * order.quantity,
      1,
      order.fulfillment,
    );
    if (data.shippingCents !== payment.shippingCents)
      throw new BadRequestException(
        'A entrega custa R$ 15,00 e a retirada é gratuita.',
      );
    const result = await this.prisma.order.updateMany({
      where: { id, status: 'AGUARDANDO_CONFIRMACAO' },
      data: {
        ...payment,
        fulfillmentViaWhatsapp: false,
        deliveryFeeCents: OWN_DELIVERY_FEE_CENTS,
      },
    });
    if (!result.count)
      throw new ConflictException('O pedido foi alterado. Atualize a lista.');
    return { id };
  }

  async confirmPayment(id: string, adminId: number, data: ConfirmPaymentDto) {
    try {
      const result = await this.prisma.order.updateMany({
        where: { id, status: 'AGUARDANDO_PAGAMENTO' },
        data: {
          status: 'PAGO',
          fulfillmentStatus: 'PREPARANDO',
          paidAt: new Date(),
          confirmedById: adminId,
          bankReference: data.bankReference,
        },
      });
      if (!result.count)
        throw new ConflictException(
          'O pedido precisa estar aguardando pagamento. Atualize a lista.',
        );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Esta transação bancária já foi associada a outro pedido.',
        );
      }
      throw error;
    }
    return { id };
  }

  async chooseFulfillment(
    id: string,
    userId: number,
    data: ChooseFulfillmentDto,
  ) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (order.status !== 'AGUARDANDO_CONFIRMACAO' || order.pixPayload)
      throw new ConflictException(
        'O Pix deste pedido já foi emitido. Combine qualquer alteração com a Maia pelo WhatsApp.',
      );
    requireOrderContact();
    const payment = this.paymentData(
      order.id,
      order.subtotalCents ?? order.unitPriceCents * order.quantity,
      1,
      data.fulfillment,
    );
    const result = await this.prisma.order.updateMany({
      where: {
        id,
        userId,
        status: 'AGUARDANDO_CONFIRMACAO',
        pixPayload: null,
      },
      data: {
        fulfillment: data.fulfillment,
        fulfillmentViaWhatsapp: false,
        deliveryFeeCents: OWN_DELIVERY_FEE_CENTS,
        ...payment,
      },
    });
    if (!result.count)
      throw new ConflictException('O pedido foi alterado. Atualize a página.');
    // Somente pedidos antigos sem cobrança emitida podem escolher e gerar o Pix aqui.
    return { id, fulfillment: data.fulfillment };
  }

  async updateProgress(
    id: string,
    adminId: number,
    input: UpdateOrderProgressDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Pedido não encontrado.');
      if (order.status !== 'PAGO')
        throw new ConflictException(
          'Confirme o recebimento do Pix antes de preparar ou concluir o pedido.',
        );
      if (order.fulfillmentStatus !== input.expectedStatus)
        throw new ConflictException(
          'A etapa do pedido mudou. Atualize a lista antes de continuar.',
        );
      const next =
        order.fulfillmentStatus === 'PREPARANDO'
          ? order.fulfillment === 'ENTREGA'
            ? 'SAIU_PARA_ENTREGA'
            : order.fulfillment === 'RETIRADA'
              ? 'PRONTO_PARA_RETIRADA'
              : 'CONCLUIDO'
          : ['SAIU_PARA_ENTREGA', 'PRONTO_PARA_RETIRADA'].includes(
                order.fulfillmentStatus,
              )
            ? 'CONCLUIDO'
            : null;
      if (next !== input.status)
        throw new BadRequestException(
          'Esta etapa não corresponde ao recebimento escolhido ou à situação atual.',
        );
      const result = await tx.order.updateMany({
        where: { id, status: 'PAGO', fulfillmentStatus: input.expectedStatus },
        data: { fulfillmentStatus: input.status },
      });
      if (!result.count)
        throw new ConflictException('O pedido foi alterado. Atualize a lista.');
      await tx.orderProgressEvent.create({
        data: {
          orderId: id,
          actorId: adminId,
          fromStatus: input.expectedStatus,
          status: input.status,
        },
      });
      return { id, fulfillmentStatus: input.status };
    });
  }
}
