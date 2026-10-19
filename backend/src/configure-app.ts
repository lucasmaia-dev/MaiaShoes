import { type INestApplication, ValidationPipe } from '@nestjs/common';

// Produção e testes HTTP usam as mesmas regras de entrada.
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  }));
}
