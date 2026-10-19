import 'dotenv/config';
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Configure DATABASE_URL no arquivo backend/.env.');
    }
    const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 5000 });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async checkConnection() {
    // A contagem confirma tanto a conexão quanto a existência da tabela.
    const products = await this.product.count();
    return { status: 'ok', database: 'postgresql', products };
  }
}
