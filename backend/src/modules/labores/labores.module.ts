import { Module } from '@nestjs/common';
import { LaboresController } from './labores.controller';
import { LaboresService } from './labores.service';

@Module({
  controllers: [LaboresController],
  providers: [LaboresService],
  exports: [LaboresService],
})
export class LaboresModule {}
