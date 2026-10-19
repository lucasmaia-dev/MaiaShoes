import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: env('DATABASE_URL'),
    // Banco auxiliar usado apenas pelo Prisma ao preparar migrações locais.
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
});
