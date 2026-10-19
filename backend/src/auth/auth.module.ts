import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AdminGuard, CsrfGuard, SessionGuard } from './auth.guards.js';

@Module({
  imports: [DatabaseModule, ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] })],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, AdminGuard, CsrfGuard],
  exports: [AuthService, SessionGuard, AdminGuard, CsrfGuard],
})
export class AuthModule {}
