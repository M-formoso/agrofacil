import { Module } from '@nestjs/common';
import { LotesCampaniaController } from './lotes-campania.controller';
import { LotesCampaniaService } from './lotes-campania.service';

@Module({
  controllers: [LotesCampaniaController],
  providers: [LotesCampaniaService],
  exports: [LotesCampaniaService],
})
export class LotesCampaniaModule {}
