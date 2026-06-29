import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CuentasAdminService } from './cuentas-admin.service';
import { UsuariosAdminService } from './usuarios-admin.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [AdminController],
  providers: [CuentasAdminService, UsuariosAdminService],
})
export class AdminModule {}
