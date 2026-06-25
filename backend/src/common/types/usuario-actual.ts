import type { RolEnCuenta, RolGlobal } from '@prisma/client';

export interface MembresiaResumen {
  cuentaId: string;
  cuentaNombre: string;
  rol: RolEnCuenta;
}

export interface UsuarioActual {
  id: string;
  email: string;
  nombre: string;
  rolGlobal: RolGlobal;
  /** Cuenta actualmente activa en el JWT. Para propietarios siempre es la misma. */
  cuentaId: string;
  /** Rol del usuario en la cuenta activa. */
  rolEnCuentaActiva: RolEnCuenta;
  /** Todas las cuentas a las que el usuario tiene acceso. */
  membresias: MembresiaResumen[];
}
