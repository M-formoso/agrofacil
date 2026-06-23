import { Controller, Get, Query } from '@nestjs/common';
import { ClimaService } from './clima.service';
import { coordenadasSchema, historicoSchema } from './clima.dto';

@Controller('clima')
export class ClimaController {
  constructor(private readonly service: ClimaService) {}

  @Get('actual')
  actual(@Query() query: Record<string, string>) {
    const { lat, lon } = coordenadasSchema.parse(query);
    return this.service.actual(lat, lon);
  }

  @Get('pronostico')
  pronostico(@Query() query: Record<string, string>) {
    const { lat, lon } = coordenadasSchema.parse(query);
    return this.service.pronostico(lat, lon);
  }

  @Get('historico')
  historico(@Query() query: Record<string, string>) {
    const { lat, lon, desde, hasta } = historicoSchema.parse(query);
    return this.service.historico(lat, lon, desde, hasta);
  }
}
