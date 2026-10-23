import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  Patch,
  Post,
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
import { OrdersService } from './orders.service.js';
import {
  ApproveOrderDto,
  ConfirmPaymentDto,
  CreateOrderDto,
  ChooseFulfillmentDto,
  CreateCartOrderDto,
  UpdateOrderProgressDto,
} from './orders.dto.js';

@Controller('orders')
@UseGuards(CsrfGuard, SessionGuard, ThrottlerGuard)
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly orders: OrdersService) {}
  @Post() create(@Req() request: AuthRequest, @Body() data: CreateOrderDto) {
    return this.orders.create(request.user!.id, data);
  }
  @Post('cart') createCart(
    @Req() request: AuthRequest,
    @Body() data: CreateCartOrderDto,
  ) {
    return this.orders.createCart(request.user!.id, data);
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  mine(@Req() request: AuthRequest) {
    return this.orders.mine(request.user!.id);
  }
  @Get('moderation')
  @Header('Cache-Control', 'no-store')
  @UseGuards(AdminGuard)
  moderation() {
    return this.orders.moderationList();
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  detail(@Param('id') id: string, @Req() request: AuthRequest) {
    return this.orders.detail(id, request.user!.id);
  }
  @Patch(':id/approve')
  @UseGuards(AdminGuard)
  approve(@Param('id') id: string, @Body() data: ApproveOrderDto) {
    return this.orders.approve(id, data);
  }
  @Patch(':id/payment')
  @UseGuards(AdminGuard)
  payment(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() data: ConfirmPaymentDto,
  ) {
    return this.orders.confirmPayment(id, request.user!.id, data);
  }
  @Patch(':id/fulfillment')
  fulfillment(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() data: ChooseFulfillmentDto,
  ) {
    return this.orders.chooseFulfillment(id, request.user!.id, data);
  }
  @Patch(':id/progress')
  @UseGuards(AdminGuard)
  progress(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() data: UpdateOrderProgressDto,
  ) {
    return this.orders.updateProgress(id, request.user!.id, data);
  }
}
