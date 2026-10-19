import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  // A porta 3000 pertence ao front-end. Esta API só escuta no computador local.
  await app.listen(process.env.PORT ?? 3001, '127.0.0.1');
}
await bootstrap();
