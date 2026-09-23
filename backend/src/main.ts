import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile and web clients
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  // Enable global request validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
    }),
  );

  const port = process.env.PORT || 3000;
  // Listen on 0.0.0.0 for Render deployment compatibility and network access
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 NestJS Backend server listening on http://0.0.0.0:${port}`);
}

bootstrap();
