// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: EOQ CON FALTANTES PLANEADOS (Escasez)
//  ---------------------------------------------------------------------------
//  Calcula la Cantidad Economica de Pedido permitiendo escasez controlada,
//  minimizando los costos de ordenar, mantener inventario y penalizaciones
//  por faltantes.
// ══════════════════════════════════════════════════════════════════════════════

export interface EOQEscasezDesgloses {
  /** Desglose LaTeX del calculo de Q (Cantidad Optima) */
  Q: string;
  /** Desglose LaTeX del calculo de S_max (Inventario Maximo) */
  S_max: string;
  /** Desglose LaTeX del calculo de W (Escasez Maxima) */
  W: string;
  /** Desglose LaTeX del calculo de CTA (Costo Total Asociado) */
  CTA: string;
  /** Desglose LaTeX del calculo de N (Numero de Pedidos) */
  N: string;
  /** Desglose LaTeX del cálculo de T (Tiempo entre Órdenes en años) */
  T: string;
  /** Desglose LaTeX del calculo de T_dias (Tiempo entre Ordenes en dias) */
  T_dias: string;
}

export interface EOQEscasezInput {
  /** Demanda anual del producto (unidades/año) */
  demandaAnual: number;
  /** Costo por colocar una orden de pedido (moneda/orden) */
  costoPedido: number;
  /** Costo de mantener una unidad en inventario por año (moneda/unid-año) */
  costoMantenimiento: number;
  /** Costo por carecer/faltante de una unidad por año (moneda/unid-año) */
  costoEscasez: number;
  /** Días laborables al año (por defecto 300) */
  diasLaborables: number;
}

export interface EOQEscasezOutput {
  /** Cantidad optima de pedido (Q) */
  cantidadOptima: number;
  /** Nivel maximo de inventario (S_max) */
  inventarioMaximo: number;
  /** Tamano de la escasez maxima (W) */
  escasezMaxima: number;
  /** Costo total asociado a la politica (CTA) */
  costoTotal: number;
  /** Número de pedidos al año (N) */
  numeroPedidos: number;
  /** Tiempo entre órdenes en años (T) */
  tiempoEntreOrdenes: number;
  /** Tiempo entre ordenes en dias (T_dias) */
  tiempoEntreOrdenesDias: number;
  /** Objeto con strings en sintaxis LaTeX mostrando la sustitucion paso a paso */
  desgloses: EOQEscasezDesgloses;
}

// ══════════════════════════════════════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════════════════════════════════════

function f4(value: number): string {
  return value.toFixed(4);
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORMULAS FUNDAMENTALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Cantidad Optima de Pedido con Escasez (Q)
 *
 *            ┌─────────────────────
 *           ╱  2 × D × S × (H + P)
 *   Q =    ╱   ───────────────────
 *        ╲╱          H × P
 *
 * Donde:
 *   D = Demanda anual (unidades/año)
 *   S = Costo por colocar un pedido (moneda/orden)
 *   H = Costo anual de mantener una unidad (moneda/unid-año)
 *   P = Costo anual por escasez de una unidad (moneda/unid-año)
 */
function cantidadOptimaPedidoEscasez(
  demandaAnual: number,
  costoPedido: number,
  costoMantenimiento: number,
  costoEscasez: number,
): number {
  return Math.sqrt(
    (2 * demandaAnual * costoPedido * (costoMantenimiento + costoEscasez)) /
      (costoMantenimiento * costoEscasez),
  );
}

/**
 * Nivel Maximo de Inventario (S_max)
 *
 *                   P
 *   S_max = Q × ─────────
 *                H + P
 */
function inventarioMaximo(
  qOptima: number,
  costoMantenimiento: number,
  costoEscasez: number,
): number {
  return qOptima * (costoEscasez / (costoMantenimiento + costoEscasez));
}

/**
 * Escasez Maxima (W)
 *
 *                   H
 *   W = Q × ─────────
 *              H + P
 */
function escasezMaxima(
  qOptima: number,
  costoMantenimiento: number,
  costoEscasez: number,
): number {
  return qOptima * (costoMantenimiento / (costoMantenimiento + costoEscasez));
}

/**
 * Costo Total Asociado (CTA) — Formula compacta
 *
 *             ┌─────────────────────
 *            ╱  2 × D × S × H × P
 *   CTA =   ╱   ──────────────────
 *         ╲╱         H + P
 */
function costoTotalAsociadoCompacto(
  demandaAnual: number,
  costoPedido: number,
  costoMantenimiento: number,
  costoEscasez: number,
): number {
  return Math.sqrt(
    (2 * demandaAnual * costoPedido * costoMantenimiento * costoEscasez) /
      (costoMantenimiento + costoEscasez),
  );
}

/**
 * Numero de Pedidos al Ano (N)
 *
 *          D
 *   N =  ───
 *          Q
 */
function numeroPedidosAnual(demandaAnual: number, qOptima: number): number {
  return demandaAnual / qOptima;
}

/**
 * Tiempo entre Ordenes en Anos (T)
 *
 *          Q
 *   T =  ───
 *          D
 */
function tiempoEntreOrdenesAnios(
  qOptima: number,
  demandaAnual: number,
): number {
  return qOptima / demandaAnual;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCION PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function calculateEOQEscasez(input: EOQEscasezInput): EOQEscasezOutput {
  const {
    demandaAnual,
    costoPedido,
    costoMantenimiento,
    costoEscasez,
    diasLaborables,
  } = input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (demandaAnual <= 0) {
    throw new Error("La demanda anual debe ser mayor a cero.");
  }
  if (costoPedido <= 0) {
    throw new Error("El costo de pedido debe ser mayor a cero.");
  }
  if (costoMantenimiento <= 0) {
    throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  }
  if (costoEscasez <= 0) {
    throw new Error("El costo de escasez debe ser mayor a cero.");
  }
  if (diasLaborables <= 0) {
    throw new Error("Los dias laborables deben ser mayores a cero.");
  }

  // ─── Calculos ─────────────────────────────────────────────────────────────

  const D = demandaAnual;
  const S = costoPedido;
  const H = costoMantenimiento;
  const P = costoEscasez;
  const L = diasLaborables;

  const Q = cantidadOptimaPedidoEscasez(D, S, H, P);
  const S_max = inventarioMaximo(Q, H, P);
  const W = escasezMaxima(Q, H, P);
  const CTA = costoTotalAsociadoCompacto(D, S, H, P);
  const N = numeroPedidosAnual(D, Q);
  const T = tiempoEntreOrdenesAnios(Q, D);
  const T_dias = T * L;

  // ─── Generacion de desgloses en LaTeX ─────────────────────────────────────

  const desgloseQ =
    `Q = \\sqrt{\\frac{2 \\times D \\times S \\times (H + P)}{H \\times P}} = \\sqrt{\\frac{2 \\times ${D} \\times ${S} \\times (${H} + ${P})}{${H} \\times ${P}}} = ${f4(Q)}`;

  const desgloseSmax =
    `S_{\\text{max}} = Q \\times \\frac{P}{H + P} = ${f4(Q)} \\times \\frac{${P}}{${H} + ${P}} = ${f4(S_max)}`;

  const desgloseW =
    `W = Q \\times \\frac{H}{H + P} = ${f4(Q)} \\times \\frac{${H}}{${H} + ${P}} = ${f4(W)}`;

  const desgloseCTA =
    `CTA = \\sqrt{\\frac{2 \\times D \\times S \\times H \\times P}{H + P}} = \\sqrt{\\frac{2 \\times ${D} \\times ${S} \\times ${H} \\times ${P}}{${H} + ${P}}} = ${f4(CTA)}`;

  const desgloseN =
    `N = \\frac{D}{Q} = \\frac{${D}}{${f4(Q)}} = ${f4(N)}`;

  const desgloseT =
    `T = \\frac{Q}{D} = \\frac{${f4(Q)}}{${D}} = ${f4(T)} \\ \\text{años}`;

  const desgloseTdias =
    `T_{\\text{dias}} = T \\times L = ${f4(T)} \\times ${L} = ${f4(T_dias)} \\ \\text{días}`;

  return {
    cantidadOptima: Q,
    inventarioMaximo: S_max,
    escasezMaxima: W,
    costoTotal: CTA,
    numeroPedidos: N,
    tiempoEntreOrdenes: T,
    tiempoEntreOrdenesDias: T_dias,
    desgloses: {
      Q: desgloseQ,
      S_max: desgloseSmax,
      W: desgloseW,
      CTA: desgloseCTA,
      N: desgloseN,
      T: desgloseT,
      T_dias: desgloseTdias,
    },
  };
}
