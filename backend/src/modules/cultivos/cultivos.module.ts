import { Module } from '@nestjs/common';
import { CultivosController } from './cultivos.controller';
import { CultivosService } from './cultivos.service';

@Module({
  controllers: [CultivosController],
  providers: [CultivosService],
  exports: [CultivosService],
})
export class CultivosModule {}
