import Decimal from 'decimal.js';

/**
 * Conversiones canónicas — único lugar donde se hacen estas cuentas.
 * Si necesitás convertir entre qq, tn, USD/tn o USD/qq, hacelo desde acá.
 */

export const QQ_POR_TN = 10;

/** USD/tn → USD/qq (divide por 10). */
export const precioUsdPorQq = (precioUsdPorTn: Decimal | number): Decimal => {
  const d = precioUsdPorTn instanceof Decimal ? precioUsdPorTn : new Decimal(precioUsdPorTn);
  return d.div(QQ_POR_TN);
};

/** Producción en toneladas = rinde_qq_ha * superficie_ha / 10. */
export const produccionTn = (
  rindeQqHa: Decimal | number,
  superficieHa: Decimal | number,
): Decimal => {
  const r = rindeQqHa instanceof Decimal ? rindeQqHa : new Decimal(rindeQqHa);
  const s = superficieHa instanceof Decimal ? superficieHa : new Decimal(superficieHa);
  return r.times(s).div(QQ_POR_TN);
};

/** Ingreso bruto USD = rinde_qq_ha * superficie_ha * precio_usd_qq. */
export const ingresoUsd = (
  rindeQqHa: Decimal | number,
  superficieHa: Decimal | number,
  precioUsdQq: Decimal | number,
): Decimal => {
  const r = rindeQqHa instanceof Decimal ? rindeQqHa : new Decimal(rindeQqHa);
  const s = superficieHa instanceof Decimal ? superficieHa : new Decimal(superficieHa);
  const p = precioUsdQq instanceof Decimal ? precioUsdQq : new Decimal(precioUsdQq);
  return r.times(s).times(p);
};

/** Helper para convertir Decimal -> string fijado a 2 decimales en respuestas. */
export const toFixed2 = (d: Decimal): string => d.toFixed(2);
