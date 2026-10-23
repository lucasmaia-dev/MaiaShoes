import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  AdminGuard,
  CsrfGuard,
  SessionGuard,
  type AuthRequest,
} from '../auth/auth.guards.js';
import { FeedbackService } from './feedback.service.js';
import { ModerateFeedbackDto, SaveFeedbackDto } from './feedback.dto.js';

@Controller('feedback')
@UseGuards(CsrfGuard)
export class FeedbackController {
  constructor(
    @Inject(FeedbackService) private readonly feedback: FeedbackService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  publicReviews() {
    return this.feedback.publicReviews();
  }

  @Get('mine')
  @UseGuards(SessionGuard)
  @Header('Cache-Control', 'no-store')
  mine(@Req() request: AuthRequest) {
    return this.feedback.mine(request.user!.id);
  }

  @Put()
  @UseGuards(SessionGuard, ThrottlerGuard)
  save(@Req() request: AuthRequest, @Body() data: SaveFeedbackDto) {
    return this.feedback.save(request.user!, data);
  }

  @Get('moderation')
  @UseGuards(SessionGuard, AdminGuard)
  @Header('Cache-Control', 'no-store')
  moderationList() {
    return this.feedback.moderationList();
  }

  @Patch(':id/status')
  @UseGuards(SessionGuard, AdminGuard)
  moderate(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthRequest,
    @Body() data: ModerateFeedbackDto,
  ) {
    return this.feedback.moderate(id, request.user!.id, data);
  }
}
