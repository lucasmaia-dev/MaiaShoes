import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { ProductsModule } from './products/products.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, ProductsModule, FeedbackModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
