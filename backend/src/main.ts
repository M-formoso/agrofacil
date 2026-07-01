import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  // CORS_ORIGIN puede ser una sola URL o varias separadas por coma —
  // así soportamos la URL de Railway y el dominio propio en simultáneo.
  const corsRaw = config.get<string>('corsOrigin') ?? 'http://localhost:5173';
  const origin = corsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({ origin, credentials: true });

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`🚜 AgroFacil API en http://localhost:${port}/api/v1`);
}

bootstrap();
