// Formatters argentino para AgroFácil — único lugar canónico para formatear unidades del dominio.

export const formatearFecha = (d: Date | string): string =>
  new Date(d).toLocaleDateString('es-AR');

export const formatearFechaHora = (d: Date | string): string =>
  new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export const formatearUsd = (monto: number | string): string => {
  const n = typeof monto === 'string' ? Number(monto) : monto;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatearHa = (ha: number | string): string => {
  const n = typeof ha === 'string' ? Number(ha) : ha;
  return `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ha`;
};

export const formatearQqHa = (qqHa: number | string): string => {
  const n = typeof qqHa === 'string' ? Number(qqHa) : qqHa;
  return `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} qq/ha`;
};

export const formatearQq = (qq: number | string): string => {
  const n = typeof qq === 'string' ? Number(qq) : qq;
  return `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} qq`;
};

export const formatearTn = (tn: number | string): string => {
  const n = typeof tn === 'string' ? Number(tn) : tn;
  return `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })} tn`;
};

// Conversión canónica — qq <-> tn
export const QQ_POR_TN = 10;
export const precioUsdPorQq = (precioUsdPorTn: number): number => precioUsdPorTn / QQ_POR_TN;
