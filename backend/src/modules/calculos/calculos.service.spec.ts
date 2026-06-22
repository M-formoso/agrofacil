import Decimal from 'decimal.js';
import { CalculosService } from './calculos.service';
import { precioUsdPorQq, produccionTn, ingresoUsd } from './conversiones';

// Mock mínimo de PrismaService — los tests directos de fórmulas no lo usan.
const prismaMock = {} as never;

describe('CalculosService — fórmulas (unitarios sin BD)', () => {
  const service = new CalculosService(prismaMock);

  // ============================================================
  // Conversiones canónicas
  // ============================================================
  describe('conversiones', () => {
    it('precioUsdPorQq: 320 USD/tn = 32 USD/qq', () => {
      expect(precioUsdPorQq(320).toNumber()).toBe(32);
    });

    it('produccionTn: 38 qq/ha × 80 ha = 304 tn', () => {
      expect(produccionTn(38, 80).toNumber()).toBe(304);
    });

    it('ingresoUsd: 38 qq/ha × 80 ha × 32 USD/qq = 97280 USD', () => {
      expect(ingresoUsd(38, 80, 32).toNumber()).toBe(97280);
    });
  });

  // ============================================================
  // Punto de equilibrio
  // ============================================================
  describe('punto de equilibrio (rinde de indiferencia)', () => {
    it('costo_ha 800 / precio 30 USD/tn (3 USD/qq) → 266.67 qq/ha', () => {
      const costoTotalHa = new Decimal(800);
      const precioUsdQq = precioUsdPorQq(30);
      const equilibrio = costoTotalHa.div(precioUsdQq);
      expect(equilibrio.toDecimalPlaces(2).toNumber()).toBeCloseTo(266.67, 2);
    });
  });

  // ============================================================
  // Arrendamiento por unidad
  // ============================================================
  describe('arrendamiento', () => {
    const superficieHa = new Decimal(80);
    const precioUsdQq = new Decimal(32);
    const ingresoBruto = new Decimal(97280);

    it('lote propio → costo = 0 (aunque haya valor)', () => {
      const c = service.calcularArrendamiento({
        tenencia: 'propio',
        unidad: 'qq_ha',
        valor: 4 as never,
        superficieHa,
        precioUsdQq,
        ingresoBruto,
      });
      expect(c.toNumber()).toBe(0);
    });

    it('qq_ha: 4 qq/ha × 80 ha × 32 USD/qq = 10240 USD', () => {
      const c = service.calcularArrendamiento({
        tenencia: 'arrendado',
        unidad: 'qq_ha',
        valor: new Decimal(4),
        superficieHa,
        precioUsdQq,
        ingresoBruto,
      });
      expect(c.toNumber()).toBe(10240);
    });

    it('usd_ha: 150 USD/ha × 80 ha = 12000 USD', () => {
      const c = service.calcularArrendamiento({
        tenencia: 'arrendado',
        unidad: 'usd_ha',
        valor: new Decimal(150),
        superficieHa,
        precioUsdQq,
        ingresoBruto,
      });
      expect(c.toNumber()).toBe(12000);
    });

    it('pct_produccion: 15% de 97280 = 14592 USD', () => {
      const c = service.calcularArrendamiento({
        tenencia: 'arrendado',
        unidad: 'pct_produccion',
        valor: new Decimal(15),
        superficieHa,
        precioUsdQq,
        ingresoBruto,
      });
      expect(c.toNumber()).toBe(14592);
    });
  });

  // ============================================================
  // Caso de oro — verificado a mano
  // ============================================================
  describe('caso de oro (verificado a mano)', () => {
    /**
     * Soja, lote arrendado:
     * - superficie 80 ha
     * - rinde estimado 38 qq/ha
     * - precio 320 USD/tn (32 USD/qq)
     * - insumos: 8000 USD, labores: 6000 USD
     * - arrendamiento: 4 qq/ha
     *
     * Cálculos esperados:
     *   ingreso_bruto  = 38 × 80 × 32         = 97280
     *   costo_directo  = 8000 + 6000          = 14000
     *   c.arrendamiento = 4 × 80 × 32         = 10240
     *   costo_total    = 14000 + 10240        = 24240
     *   costo_total_ha = 24240 / 80           = 303
     *   margen_bruto   = 97280 - 14000        = 83280
     *   margen_neto    = 83280 - 10240        = 73040
     *   margen_neto_ha = 73040 / 80           = 913
     *   margen_neto_qq_ha = 913 / 32          = 28.53
     *   rinde_equil    = 303 / 32             = 9.469 qq/ha
     *   margen_seg_qq  = 38 - 9.469           = 28.53 qq/ha
     */
    const lc = {
      id: 'lc-1',
      superficieSembradaHa: new Decimal(80),
      precioGranoUsdTn: new Decimal(320),
      rindeRealQqHa: null,
      rindeEstimadoQqHa: new Decimal(38),
      lote: {
        nombre: 'Lote 4',
        tenencia: 'arrendado' as const,
        arrendamientoUnidad: 'qq_ha' as const,
        arrendamientoValor: new Decimal(4),
      },
      cultivo: { nombre: 'soja' },
      labores: [
        { costoTotalUsd: new Decimal(6000) },
      ],
      insumosAplicados: [
        { costoTotalUsd: new Decimal(8000) },
      ],
    };

    const r = service.computarResultado(lc);

    it('ingreso bruto = 97280', () => {
      expect(Number(r.ingresoBruto)).toBe(97280);
    });

    it('costo directo = 14000', () => {
      expect(Number(r.costos.directo)).toBe(14000);
    });

    it('costo arrendamiento = 10240', () => {
      expect(Number(r.costos.arrendamiento)).toBe(10240);
    });

    it('costo total = 24240', () => {
      expect(Number(r.costos.total)).toBe(24240);
    });

    it('costo total /ha = 303', () => {
      expect(Number(r.costos.totalHa)).toBe(303);
    });

    it('margen bruto = 83280', () => {
      expect(Number(r.margenes.bruto)).toBe(83280);
    });

    it('margen neto = 73040', () => {
      expect(Number(r.margenes.neto)).toBe(73040);
    });

    it('margen neto /ha = 913', () => {
      expect(Number(r.margenes.netoHa)).toBe(913);
    });

    it('margen neto qq/ha ≈ 28.53', () => {
      expect(Number(r.margenes.netoQqHa)).toBeCloseTo(28.53, 1);
    });

    it('rinde de equilibrio ≈ 9.47 qq/ha', () => {
      expect(Number(r.puntoEquilibrio.rindeQqHa)).toBeCloseTo(9.47, 1);
    });

    it('margen seguridad ≈ 28.53 qq/ha', () => {
      expect(Number(r.puntoEquilibrio.margenSeguridadQq)).toBeCloseTo(28.53, 1);
    });

    it('marca el resultado como proyección (no hay rinde real)', () => {
      expect(r.esProyeccion).toBe(true);
      expect(r.rindeFuente).toBe('estimado');
    });

    it('cuando se carga rinde real → deja de ser proyección', () => {
      const rReal = service.computarResultado({
        ...lc,
        rindeRealQqHa: new Decimal(40),
      });
      expect(rReal.esProyeccion).toBe(false);
      expect(rReal.rindeFuente).toBe('real');
      // ingreso recalculado con rinde real
      expect(Number(rReal.ingresoBruto)).toBe(40 * 80 * 32); // 102400
    });
  });

  // ============================================================
  // REGLA DE ORO: agregaciones NO promedian promedios
  // ============================================================
  describe('agregaciones — recalcular /ha sobre superficie agregada', () => {
    /**
     * Lote A: 100 ha, margen 30000 → margen/ha = 300
     * Lote B: 200 ha, margen 80000 → margen/ha = 400
     *
     * Promedio INCORRECTO de los /ha: (300 + 400) / 2 = 350
     * Correcto (recalc sobre superficie agregada): (30000 + 80000) / (100 + 200) = 366.67
     */
    it('margen_neto_ha agregado ≠ promedio aritmético de los /ha', () => {
      const sup = new Decimal(100).plus(200);
      const margenTotal = new Decimal(30000).plus(80000);
      const margenHaCorrecto = margenTotal.div(sup);
      expect(margenHaCorrecto.toDecimalPlaces(2).toNumber()).toBeCloseTo(366.67, 2);

      // Verificación negativa: el promedio simple da 350 → este NO es el camino correcto
      const promedioSimple = new Decimal(300).plus(400).div(2);
      expect(promedioSimple.toNumber()).toBe(350);
      expect(promedioSimple.toNumber()).not.toBeCloseTo(366.67, 1);
    });
  });
});
