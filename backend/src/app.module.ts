import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CultivosModule } from './modules/cultivos/cultivos.module';
import { EstablecimientosModule } from './modules/establecimientos/establecimientos.module';
import { LotesModule } from './modules/lotes/lotes.module';
import { CampaniasModule } from './modules/campanias/campanias.module';
import { LotesCampaniaModule } from './modules/lotes-campania/lotes-campania.module';
import { LaboresModule } from './modules/labores/labores.module';
import { InsumosAplicadosModule } from './modules/insumos-aplicados/insumos-aplicados.module';
import { CalculosModule } from './modules/calculos/calculos.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'long', ttl: 60_000 * 15, limit: 200 },
    ]),
    PrismaModule,
    AuthModule,
    CultivosModule,
    EstablecimientosModule,
    LotesModule,
    CampaniasModule,
    LotesCampaniaModule,
    LaboresModule,
    InsumosAplicadosModule,
    CalculosModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
