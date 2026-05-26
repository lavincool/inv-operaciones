// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: EPQ (LOTE ECONOMICO DE PRODUCCION)
//  ---------------------------------------------------------------------------
//  Calcula el lote optimo de produccion cuando el inventario se repone de
//  forma gradual (tasa de produccion) en lugar de instantaneamente.
// ══════════════════════════════════════════════════════════════════════════════

export interface EPQDesgloses {
  /** Desglose LaTeX del calculo de Q (Lote Optimo de Produccion) */
  Q: string;
  /** Desglose LaTeX del calculo de N (Frecuencia de Corridas) */
  N: string;
  /** Desglose LaTeX del calculo de T (Tiempo entre Corridas en dias) */
  T: string;
  /** Desglose LaTeX del calculo de CTA (Costo Total Anual) */
  CTA: string;
}

export interface EPQInput {
  /** Demanda anual del producto (unidades/año) */
  demandaAnual: number;
  /** Costo por preparacion o corrida de produccion (moneda/corrida) */
  costoPreparacion: number;
  /** Costo de mantener una unidad en inventario por año (moneda/unid-año) */
  costoMantenimiento: number;
  /** Tasa anual de producción (unidades/año) */
  tasaProduccion: number;
  /** Días laborables por año */
  diasHabiles: number;
}

export interface EPQOutput {
  /** Cantidad optima a producir en cada corrida (Q) */
  loteOptimo: number;
  /** Número de corridas de producción al año (N) */
  frecuencia: number;
  /** Tiempo entre corridas en dias (T) */
  tiempoCorridas: number;
  /** Costo total anual de preparacion + mantenimiento (CTA) */
  costoTotal: number;
  /** Objeto con strings en sintaxis LaTeX mostrando la sustitucion paso a paso */
  desgloses: EPQDesgloses;
}

// ══════════════════════════════════════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════════════════════════════════════

function fmt(value: number, decimals = 4): string {
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORMULAS FUNDAMENTALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Lote Optimo de Produccion (Q)
 *
 *            ┌─────────────────────
 *           ╱         2 × D × S
 *   Q =    ╱   ───────────────────────
 *        ╲╱      H × (1 − D / P)
 *
 * Donde:
 *   D = Demanda anual (unidades/año)
 *   S = Costo de preparacion por corrida (moneda/corrida)
 *   H = Costo anual de mantener una unidad (moneda/unid-año)
 *   P = Tasa anual de producción (unidades/año)
 *
 * Requiere que P > D (tasa de produccion mayor que la demanda).
 */
function loteOptimoProduccion(
  demandaAnual: number,
  costoPreparacion: number,
  costoMantenimiento: number,
  tasaProduccion: number,
): number {
  return Math.sqrt(
    (2 * demandaAnual * costoPreparacion) /
      (costoMantenimiento * (1 - demandaAnual / tasaProduccion)),
  );
}

/**
 * Frecuencia de Corridas de Produccion (N)
 *
 *          D
 *   N =  ───
 *          Q
 *
 * Donde:
 *   D = Demanda anual
 *   Q = Lote optimo de produccion
 */
function frecuenciaCorridas(demandaAnual: number, qOptima: number): number {
  return demandaAnual / qOptima;
}

/**
 * Tiempo entre Corridas en Dias (T)
 *
 *          L
 *   T =  ───
 *          N
 *
 * Donde:
 *   L = Días laborables al año
 *   N = Frecuencia de corridas
 *
 * Este es el tiempo que transcurre entre el inicio de una corrida y la
 * siguiente, expresado en dias laborables.
 */
function tiempoEntreCorridas(
  diasHabiles: number,
  frecuencia: number,
): number {
  return diasHabiles / frecuencia;
}

/**
 * Costo Total Anual (CTA)
 *
 *           D           Q      ⎛     D ⎞
 *   CTA = ─── × S  +  ─── × ⎜1 − ───⎟ × H
 *           Q           2     ⎝     P ⎠
 *          ↑                    ↑
 *      costo de           costo de
 *      preparacion        mantenimiento
 *
 * El termino (1 − D/P) reduce el costo de mantenimiento porque el inventario
 * se acumula gradualmente durante la produccion, no todo de golpe.
 */
function costoTotalAnual(
  demandaAnual: number,
  qOptima: number,
  costoPreparacion: number,
  costoMantenimiento: number,
  tasaProduccion: number,
): number {
  const costoPreparar = (demandaAnual / qOptima) * costoPreparacion;
  const costoMantener =
    (qOptima / 2) * (1 - demandaAnual / tasaProduccion) * costoMantenimiento;
  return costoPreparar + costoMantener;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCION PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function calculateEPQ(input: EPQInput): EPQOutput {
  const {
    demandaAnual,
    costoPreparacion,
    costoMantenimiento,
    tasaProduccion,
    diasHabiles,
  } = input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (demandaAnual <= 0) {
    throw new Error("La demanda anual debe ser mayor a cero.");
  }
  if (costoPreparacion <= 0) {
    throw new Error("El costo de preparacion debe ser mayor a cero.");
  }
  if (costoMantenimiento <= 0) {
    throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  }
  if (tasaProduccion <= 0) {
    throw new Error("La tasa de produccion debe ser mayor a cero.");
  }
  if (tasaProduccion <= demandaAnual) {
    throw new Error(
      "La tasa de produccion (P) debe ser estrictamente mayor que la demanda (D) para que el modelo EPQ tenga sentido.",
    );
  }
  if (diasHabiles <= 0) {
    throw new Error("Los dias habiles deben ser mayores a cero.");
  }

  // ─── Calculos ─────────────────────────────────────────────────────────────

  const D = demandaAnual;
  const S = costoPreparacion;
  const H = costoMantenimiento;
  const P = tasaProduccion;
  const L = diasHabiles;

  const Q = loteOptimoProduccion(D, S, H, P);
  const N = frecuenciaCorridas(D, Q);
  const T = tiempoEntreCorridas(L, N);
  const CTA = costoTotalAnual(D, Q, S, H, P);

  // ─── Generacion de desgloses en LaTeX ─────────────────────────────────────

  const factorProduccion = 1 - D / P;

  const desgloseQ =
    `Q = \\sqrt{\\frac{2 \\times D \\times S}{H \\times (1 - D / P)}} = \\sqrt{\\frac{2 \\times ${D} \\times ${S}}{${H} \\times (1 - ${D} / ${P})}} = \\sqrt{\\frac{${2 * D * S}}{${H} \\times ${fmt(factorProduccion)}}} = ${fmt(Q)}`;

  const desgloseN =
    `N = \\frac{D}{Q} = \\frac{${D}}{${fmt(Q)}} = ${fmt(N)}`;

  const desgloseT =
    `T = \\frac{L}{N} = \\frac{${L}}{${fmt(N)}} = ${fmt(T)} \\ \\text{días}`;

  const desgloseCTA =
    `CTA = \\left(\\frac{D}{Q}\\right) \\times S + \\left(\\frac{Q}{2}\\right) \\times \\left(1 - \\frac{D}{P}\\right) \\times H = \\left(\\frac{${D}}{${fmt(Q)}}\\right)(${S}) + \\left(\\frac{${fmt(Q)}}{2}\\right)(${fmt(factorProduccion)})(${H}) = ${fmt(CTA)}`;

  return {
    loteOptimo: Q,
    frecuencia: N,
    tiempoCorridas: T,
    costoTotal: CTA,
    desgloses: {
      Q: desgloseQ,
      N: desgloseN,
      T: desgloseT,
      CTA: desgloseCTA,
    },
  };
}
