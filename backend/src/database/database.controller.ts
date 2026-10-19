import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller('health')
export class DatabaseController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('database')
  async getDatabaseHealth() {
    try {
      return await this.prisma.checkConnection();
    } catch {
      // Detalhes de conexão e credenciais não devem aparecer na resposta HTTP.
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }
  }
}
