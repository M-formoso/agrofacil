import { Module } from '@nestjs/common';
import { CalculosController } from './calculos.controller';
import { CalculosService } from './calculos.service';

@Module({
  controllers: [CalculosController],
  providers: [CalculosService],
  exports: [CalculosService],
})
export class CalculosModule {}
