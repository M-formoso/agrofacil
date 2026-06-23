import { Module } from '@nestjs/common';
import { LluviasController } from './lluvias.controller';
import { LluviasService } from './lluvias.service';
import { ClimaModule } from '../clima/clima.module';

@Module({
  imports: [ClimaModule],
  controllers: [LluviasController],
  providers: [LluviasService],
  exports: [LluviasService],
})
export class LluviasModule {}
