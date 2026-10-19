import { type CanActivate, type ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, SESSION_COOKIE, type PublicUser } from './auth.service.js';

export type AuthRequest = Request & { user?: PublicUser };
export function sessionToken(request: Request) {
  return request.headers.cookie?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    request.user = await this.auth.authenticate(sessionToken(request));
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest<AuthRequest>().user?.role !== 'ADMIN') {
      throw new ForbiddenException('Esta ação é exclusiva do administrador.');
    }
    return true;
  }
}

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    // Um formulário de outro site não consegue enviar este cabeçalho. Não habilitamos CORS.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers['x-maiashoes-request'] !== '1') {
      throw new ForbiddenException('Solicitação não autorizada.');
    }
    return true;
  }
}
