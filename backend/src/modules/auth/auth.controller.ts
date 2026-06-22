import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Usuario } from '../../common/decorators/usuario.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { UsuarioActual } from '../../common/types/usuario-actual';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Usuario() user: UsuarioActual) {
    return user;
  }
}
