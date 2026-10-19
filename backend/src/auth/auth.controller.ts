import { Body, ConflictException, Controller, Get, Header, HttpCode, Inject, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { CsrfGuard, SessionGuard, sessionToken, type AuthRequest } from './auth.guards.js';
import { AuthService, SESSION_COOKIE, SESSION_DURATION_MS } from './auth.service.js';
import { GoogleService, GOOGLE_COOKIE, GOOGLE_DURATION_MS } from './google.service.js';

const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' });

@Controller('auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(GoogleService) private readonly google: GoogleService) {}

  @Get('google/status')
  @Header('Cache-Control', 'no-store')
  googleStatus() {
    const config = this.google.configuration();
    return { enabled: Boolean(config), startUrl: config ? `${config.origin}/api/auth/google/start` : null };
  }

  @Get('google/start')
  @UseGuards(ThrottlerGuard)
  @Header('Cache-Control', 'no-store')
  async googleStart(@Res() response: Response) {
    const config = this.google.configuration();
    if (!config) return response.redirect('/login?google=unavailable');
    const attempt = await this.google.start();
    response.cookie(GOOGLE_COOKIE, attempt.browser, { ...cookieOptions(), maxAge: GOOGLE_DURATION_MS });
    return response.redirect(attempt.url);
  }

  @Get('google/callback')
  @UseGuards(ThrottlerGuard)
  @Header('Cache-Control', 'no-store')
  async googleCallback(@Query('code') code: unknown, @Query('state') state: unknown, @Req() request: AuthRequest, @Res() response: Response) {
    response.clearCookie(GOOGLE_COOKIE, cookieOptions());
    const browser = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${GOOGLE_COOKIE}=`))?.slice(GOOGLE_COOKIE.length + 1);
    try {
      const identity = await this.google.finish(code, state, browser);
      const session = await this.auth.loginWithGoogle(identity);
      response.cookie(SESSION_COOKIE, session.token, { ...cookieOptions(), maxAge: SESSION_DURATION_MS });
      return response.redirect(session.user.role === 'ADMIN' ? '/admin' : '/conta');
    } catch (error) {
      // Não devolver tokens, códigos ou detalhes do provedor ao navegador/log.
      return response.redirect(error instanceof ConflictException ? '/login?google=existing' : '/login?google=failed');
    }
  }

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
