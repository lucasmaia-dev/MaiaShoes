import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { PublicUser } from '../auth/auth.service.js';
import type { SaveFeedbackDto, ModerateFeedbackDto } from './feedback.dto.js';

const publicWhere = {
  kind: 'AVALIACAO',
  status: 'APROVADO',
  publishConsent: true,
} as const;
const participationSelect = {
  id: true,
  authorName: true,
  kind: true,
  message: true,
  rating: true,
  status: true,
  updatedAt: true,
} as const;

@Injectable()
export class FeedbackService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async publicReviews() {
    const [items, totals] = await Promise.all([
      this.prisma.feedback.findMany({
        where: publicWhere,
        select: {
          id: true,
          authorName: true,
          message: true,
          rating: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 12,
      }),
      this.prisma.feedback.aggregate({
        where: publicWhere,
        _count: true,
        _avg: { rating: true },
      }),
    ]);
    return {
      items,
      summary: { count: totals._count, average: totals._avg.rating },
    };
  }

  mine(userId: number) {
    return this.prisma.feedback.findMany({
      where: { userId },
      select: participationSelect,
      orderBy: { updatedAt: 'desc' },
    });
  }

  save(user: PublicUser, data: SaveFeedbackDto) {
    if (user.role !== 'CLIENTE')
      throw new ForbiddenException(
        'Use uma conta de cliente para enviar sua participação.',
      );
    if (data.kind === 'AVALIACAO' && !data.publishConsent)
      throw new BadRequestException('Autorize a publicação da avaliação.');
    const content = {
      authorName: user.name.trim().split(/\s+/)[0].slice(0, 100),
      message: data.message,
      rating: data.kind === 'AVALIACAO' ? data.rating! : null,
      publishConsent: data.kind === 'AVALIACAO',
      status: 'PENDENTE' as const,
      moderatedAt: null,
      moderatedById: null,
    };
    return this.prisma.feedback.upsert({
      where: { userId_kind: { userId: user.id, kind: data.kind } },
      create: { ...content, userId: user.id, kind: data.kind },
      update: content,
      select: participationSelect,
    });
  }

  moderationList() {
    return this.prisma.feedback.findMany({
      select: participationSelect,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async moderate(id: number, moderatorId: number, data: ModerateFeedbackDto) {
    const item = await this.prisma.feedback.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Participação não encontrada.');
    if (
      data.status === 'APROVADO' &&
      (item.kind !== 'AVALIACAO' || !item.publishConsent)
    )
      throw new BadRequestException(
        'Somente avaliações com autorização podem ser publicadas. Sugestões são privadas.',
      );
    try {
      return await this.prisma.feedback.update({
        where: { id, updatedAt: new Date(data.updatedAt) },
        data: {
          status: data.status,
          moderatedById: moderatorId,
          moderatedAt: new Date(),
        },
        select: participationSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new ConflictException(
          'Esta participação mudou. Recarregue e confira o texto antes de moderar novamente.',
        );
      throw error;
    }
  }
}
