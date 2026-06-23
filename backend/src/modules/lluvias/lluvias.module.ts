import { Module } from '@nestjs/common';
import { LluviasController } from './lluvias.controller';
import { LluviasService } from './lluvias.service';

@Module({
  controllers: [LluviasController],
  providers: [LluviasService],
  exports: [LluviasService],
})
export class LluviasModule {}
