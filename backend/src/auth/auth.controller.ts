import { Body, Controller, Get, Header, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { CsrfGuard, SessionGuard, sessionToken, type AuthRequest } from './auth.guards.js';
import { AuthService, SESSION_COOKIE, SESSION_DURATION_MS } from './auth.service.js';

const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' });

@Controller('auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Header('Cache-Control', 'no-store')
  async register(@Body() data: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(data);
    response.cookie(SESSION_COOKIE, session.token, { ...cookieOptions(), maxAge: SESSION_DURATION_MS });
    return session.user;
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Header('Cache-Control', 'no-store')
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(data);
    response.cookie(SESSION_COOKIE, session.token, { ...cookieOptions(), maxAge: SESSION_DURATION_MS });
    return session.user;
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @Header('Cache-Control', 'no-store')
  me(@Req() request: AuthRequest) { return request.user; }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(sessionToken(request));
    response.clearCookie(SESSION_COOKIE, cookieOptions());
  }
}
