# Crear Endpoint NestJS

Crea un endpoint NestJS siguiendo las convenciones del proyecto AgroFácil.

## Parámetros
- **$ARGUMENTS**: Descripción del endpoint (ej: `"GET /lotes/:id/resultado - calcular resultado de un lote_campania"`)

## Template de Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Usuario } from '../../common/decorators/usuario.decorator';
import type { UsuarioActual } from '../../common/types/usuario-actual';

import { XxxService } from './xxx.service';
import { CrearXxxDto } from './dto/crear-xxx.schema';
import { ActualizarXxxDto } from './dto/actualizar-xxx.schema';

@Controller('xxxs')
@UseGuards(JwtAuthGuard)
export class XxxController {
  constructor(private readonly service: XxxService) {}

  @Get()
  listar(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.service.listar({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
      search,
    });
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() dto: CrearXxxDto, @Usuario() user: UsuarioActual) {
    return this.service.crear(dto, user.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarXxxDto,
    @Usuario() user: UsuarioActual,
  ) {
    return this.service.actualizar(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseUUIDPipe) id: string, @Usuario() user: UsuarioActual) {
    return this.service.eliminar(id, user.id);
  }
}
```

## Convenciones

- **Verbos HTTP**: GET (lectura), POST (crear), PATCH (actualizar parcial), DELETE (soft).
- **Paths**: kebab-case y plural (`lotes-campania`, `insumos-aplicados`).
- **IDs**: siempre `ParseUUIDPipe` para validar formato.
- **Guards**: `@UseGuards(JwtAuthGuard)` a nivel controller. Endpoints públicos (ej: login) lo omiten.
- **DTOs**: validación Zod automática vía `nestjs-zod` (NO usar class-validator).
- **Paginación**: `?page=1&limit=20` con `limit` máximo de 100.
- **No lógica de negocio acá** — todo en el service.

## Decorator `@Usuario()` custom

```typescript
// src/common/decorators/usuario.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Usuario = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // poblado por JwtStrategy
  },
);
```

## Endpoints públicos
Para login/refresh/registro inicial usar `@Public()`:

```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

El `JwtAuthGuard` chequea ese metadata y deja pasar si está marcado.

## Ejemplo de uso
```
/crear-endpoint POST /lotes-campania/:id/cargar-voz - parsea audio y devuelve borrador editable
/crear-endpoint GET /campanias/:id/resumen - totales agregados por cultivo
```
