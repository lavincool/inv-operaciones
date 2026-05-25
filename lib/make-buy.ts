// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: FABRICAR O COMPRAR (Make vs. Buy)
//  ---------------------------------------------------------------------------
//  Proveedor Externo  →  EOQ (Economic Order Quantity)
//  Producción Interna →  EPQ (Economic Production Quantity)
// ══════════════════════════════════════════════════════════════════════════════

export interface OpcionDesglose {
  Q_optima: number;
  desglose_D: string;
  desglose_H: string;
  desglose_Q: string;
  desglose_CTA: string;
  CTA: number;
}

export interface ProveedorExternoOutput extends OpcionDesglose {
  pedidos_por_periodo: number;
}

export interface ProduccionInternaOutput extends OpcionDesglose {
  desglose_factor: string;
  corridas_por_periodo: number;
}

export interface TotalesOutput {
  costo_global: number;
  recomendacion: "comprar" | "fabricar";
  ahorro: number;
}

export type Periodo = "anual" | "mensual";

export interface MakeBuyInput {
  demandaTotalMensual: number;
  porcentajeCompra: number;
  porcentajeFabricacion: number;
  costoPedidoCompra: number;
  costoUnitarioCompra: number;
  costoPreparacionFab: number;
  costoUnitarioFab: number;
  tasaMantenimientoAnual: number;
  capacidadProduccionMensual: number;
  periodo: Periodo;
}

export interface MakeBuyOutput {
  proveedorExterno: ProveedorExternoOutput;
  produccionInterna: ProduccionInternaOutput;
  totales: TotalesOutput;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FÓRMULAS FUNDAMENTALES (puras, sin side effects)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Escalamiento de periodo ─────────────────────────────────────────────────

/**
 * Demanda escalada al periodo (anual o mensual)
 *
 *   D_periodo = DemandaMensual × porcentaje × (12 si anual, 1 si mensual)
 *
 * Ejemplo: 60000/mes × 0.50 × 12 = 360000 unid/año
 */
function demandaPeriodo(demandaMensual: number, porcentaje: number, esAnual: boolean): number {
  const base = demandaMensual * porcentaje;
  return esAnual ? base * 12 : base;
}

/**
 * Costo de mantener una unidad en inventario por un periodo
 *
 *   Anual:  H = i × C
 *   Mensual: H = (i/12) × C
 *
 * donde i = tasa de mantenimiento anual, C = costo unitario
 */
function costoMantenimientoPeriodo(
  tasaAnual: number,
  costoUnitario: number,
  esAnual: boolean,
): number {
  const factor = esAnual ? 1 : 1 / 12;
  return tasaAnual * costoUnitario * factor;
}

// ─── Modelo EOQ (Proveedor Externo) ─────────────────────────────────────────

/**
 * Cantidad Económica de Pedido (EOQ)
 *
 *            ┌───────────
 *           ╱  2 × D × S
 *   Q* =   ╱   ─────────
 *        ╲╱        H
 *
 * D = demanda por periodo
 * S = costo de pedido (ordenar)
 * H = costo de mantenimiento por unidad por periodo
 */
function eoq(demanda: number, costoPedido: number, costoMantenimiento: number): number {
  return Math.sqrt((2 * demanda * costoPedido) / costoMantenimiento);
}

/**
 * Costo Total para el modelo EOQ
 *
 *           D           Q
 *   CT =  ─── × S  +  ─── × H
 *           Q           2
 *
 * Término 1: costo de pedir (ordenar)
 * Término 2: costo de mantener inventario
 */
function costoTotalEOQ(
  demanda: number,
  qOptima: number,
  costoPedido: number,
  costoMantenimiento: number,
): number {
  return (demanda / qOptima) * costoPedido + (qOptima / 2) * costoMantenimiento;
}

/**
 * Número de pedidos por periodo
 *
 *               D
 *   N_pedidos = ───
 *               Q*
 */
function pedidosPorPeriodo(demanda: number, qOptima: number): number {
  return demanda / qOptima;
}

// ─── Modelo EPQ (Producción Interna) ────────────────────────────────────────

/**
 * Factor de producción para EPQ (fracción no consumida durante producción)
 *
 *               d
 *   f = 1  −  ───
 *               p
 *
 * d = demanda por periodo (mismas unidades de tiempo que p)
 * p = capacidad de producción por periodo
 */
function factorProduccion(demandaPeriodo: number, capacidadPeriodo: number): number {
  return 1 - demandaPeriodo / capacidadPeriodo;
}

/**
 * Cantidad Económica de Producción (EPQ)
 *
 *            ┌───────────────
 *           ╱    2 × D × S
 *   Q* =   ╱   ─────────────
 *        ╲╱       H × f
 *
 * D = demanda por periodo
 * S = costo de preparación (setup)
 * H = costo de mantenimiento por unidad por periodo
 * f = factor de producción (1 − d/p)
 */
function epq(
  demanda: number,
  costoPreparacion: number,
  costoMantenimiento: number,
  factor: number,
): number {
  return Math.sqrt((2 * demanda * costoPreparacion) / (costoMantenimiento * factor));
}

/**
 * Costo Total para el modelo EPQ
 *
 *           D           Q
 *   CT =  ─── × S  +  ─── × H × f
 *           Q           2
 *
 * Término 1: costo de preparar (setup)
 * Término 2: costo de mantener inventario × factor de producción
 */
function costoTotalEPQ(
  demanda: number,
  qOptima: number,
  costoPreparacion: number,
  costoMantenimiento: number,
  factor: number,
): number {
  return (demanda / qOptima) * costoPreparacion + (qOptima / 2) * costoMantenimiento * factor;
}

/**
 * Número de corridas de producción por periodo
 *
 *                 D
 *   N_corridas = ───
 *                 Q*
 */
function corridasPorPeriodo(demanda: number, qOptima: number): number {
  return demanda / qOptima;
}

// ─── Comparación y decisión ─────────────────────────────────────────────────

/**
 * Compara los costos totales y decide la mejor opción
 *
 *   Si CT_compra < CT_fab  →  comprar
 *   Si CT_compra ≥ CT_fab  →  fabricar
 *
 *   Ahorro = |CT_compra − CT_fab|
 *   Costo global = CT_compra + CT_fab
 */
function decidir(costoCompra: number, costoFab: number) {
  const externoGana = costoCompra < costoFab;
  return {
    recomendacion: externoGana ? ("comprar" as const) : ("fabricar" as const),
    ahorro: Math.abs(costoCompra - costoFab),
    costoGlobal: costoCompra + costoFab,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

function f2(value: number): string {
  return value.toFixed(2);
}

export function calculateMakeBuy(input: MakeBuyInput): MakeBuyOutput {
  const {
    demandaTotalMensual,
    porcentajeCompra,
    porcentajeFabricacion,
    costoPedidoCompra,
    costoUnitarioCompra,
    costoPreparacionFab,
    costoUnitarioFab,
    tasaMantenimientoAnual,
    capacidadProduccionMensual,
    periodo,
  } = input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (demandaTotalMensual <= 0) {
    throw new Error("La demanda total mensual debe ser mayor a cero.");
  }
  if (porcentajeCompra < 0 || porcentajeFabricacion < 0 || porcentajeCompra + porcentajeFabricacion <= 0) {
    throw new Error("Los porcentajes de compra y fabricacion deben ser validos y al menos uno mayor a cero.");
  }
  if (tasaMantenimientoAnual <= 0) {
    throw new Error("La tasa de mantenimiento anual debe ser mayor a cero.");
  }
  if (capacidadProduccionMensual <= 0) {
    throw new Error("La capacidad de produccion mensual debe ser mayor a cero.");
  }

  const esAnual = periodo === "anual";
  const etiquetaPeriodo = esAnual ? "anual" : "mensual";
  const etiquetaCosto = esAnual ? "CTA" : "CTM";

  // ─── PROVEEDOR EXTERNO — Modelo EOQ ───────────────────────────────────────

  const D_compra = demandaPeriodo(demandaTotalMensual, porcentajeCompra, esAnual);
  const H_compra = costoMantenimientoPeriodo(tasaMantenimientoAnual, costoUnitarioCompra, esAnual);
  const Q_compra = eoq(D_compra, costoPedidoCompra, H_compra);
  const CT_compra = costoTotalEOQ(D_compra, Q_compra, costoPedidoCompra, H_compra);
  const nPedidos = pedidosPorPeriodo(D_compra, Q_compra);

  // ─── PRODUCCIÓN INTERNA — Modelo EPQ ──────────────────────────────────────

  const D_fab = demandaPeriodo(demandaTotalMensual, porcentajeFabricacion, esAnual);

  // d y p se comparan en unidades mensuales (ambos son mensuales)
  const dMensual = demandaTotalMensual * porcentajeFabricacion;
  const f = factorProduccion(dMensual, capacidadProduccionMensual);

  const H_fab = costoMantenimientoPeriodo(tasaMantenimientoAnual, costoUnitarioFab, esAnual);
  const Q_fab = epq(D_fab, costoPreparacionFab, H_fab, f);
  const CT_fab = costoTotalEPQ(D_fab, Q_fab, costoPreparacionFab, H_fab, f);
  const nCorridas = corridasPorPeriodo(D_fab, Q_fab);

  // ─── Decisión ─────────────────────────────────────────────────────────────

  const decision = decidir(CT_compra, CT_fab);

  // ─── Desgloses en LaTeX ───────────────────────────────────────────────────

  const demandaMensualCompra = demandaTotalMensual * porcentajeCompra;
  const desgloseDCompra = esAnual
    ? `D_{\\text{anual, compra}} = (${demandaTotalMensual} \\times ${f2(porcentajeCompra)}) \\times 12 = ${D_compra.toFixed(0)}`
    : `D_{\\text{mensual, compra}} = ${demandaTotalMensual} \\times ${f2(porcentajeCompra)} = ${D_compra.toFixed(0)}`;

  const desgloseHCompra = esAnual
    ? `H_{\\text{compra}} = i \\times C_{\\text{compra}} = ${f2(tasaMantenimientoAnual)} \\times ${f2(costoUnitarioCompra)} = ${f2(H_compra)}`
    : `H_{\\text{compra}} = \\frac{i}{12} \\times C_{\\text{compra}} = \\frac{${f2(tasaMantenimientoAnual)}}{12} \\times ${f2(costoUnitarioCompra)} = ${f2(H_compra)}`;

  const desgloseQCompra =
    `Q_{\\text{ext}} = \\sqrt{\\frac{2 \\times ${D_compra.toFixed(0)} \\times ${f2(costoPedidoCompra)}}{${f2(H_compra)}}} = ${f2(Q_compra)}`;

  const desgloseCTACompra =
    `${etiquetaCosto}_{\\text{ext}} = \\left(\\frac{${D_compra.toFixed(0)}}{${f2(Q_compra)}}\\right)(${f2(costoPedidoCompra)}) + \\left(\\frac{${f2(Q_compra)}}{2}\\right)(${f2(H_compra)}) = ${f2(CT_compra)}`;

  const demandaMensualFab = demandaTotalMensual * porcentajeFabricacion;
  const desgloseDFab = esAnual
    ? `D_{\\text{anual, fab}} = (${demandaTotalMensual} \\times ${f2(porcentajeFabricacion)}) \\times 12 = ${D_fab.toFixed(0)}`
    : `D_{\\text{mensual, fab}} = ${demandaTotalMensual} \\times ${f2(porcentajeFabricacion)} = ${D_fab.toFixed(0)}`;

  const desgloseHFab = esAnual
    ? `H_{\\text{fab}} = i \\times C_{\\text{fab}} = ${f2(tasaMantenimientoAnual)} \\times ${f2(costoUnitarioFab)} = ${f2(H_fab)}`
    : `H_{\\text{fab}} = \\frac{i}{12} \\times C_{\\text{fab}} = \\frac{${f2(tasaMantenimientoAnual)}}{12} \\times ${f2(costoUnitarioFab)} = ${f2(H_fab)}`;

  const desgloseFactor =
    `1 - \\frac{d}{p} = 1 - \\frac{${demandaMensualFab.toFixed(0)}}{${capacidadProduccionMensual.toFixed(0)}} = ${f2(f)}`;

  const desgloseQFab =
    `Q_{\\text{int}} = \\sqrt{\\frac{2 \\times ${D_fab.toFixed(0)} \\times ${f2(costoPreparacionFab)}}{${f2(H_fab)} \\times ${f2(f)}}} = ${f2(Q_fab)}`;

  const desgloseCTAFab =
    `${etiquetaCosto}_{\\text{int}} = \\left(\\frac{${D_fab.toFixed(0)}}{${f2(Q_fab)}}\\right)(${f2(costoPreparacionFab)}) + \\left(\\frac{${f2(Q_fab)}}{2}\\right)(${f2(H_fab)})(${f2(f)}) = ${f2(CT_fab)}`;

  return {
    proveedorExterno: {
      Q_optima: Q_compra,
      desglose_D: desgloseDCompra,
      desglose_H: desgloseHCompra,
      desglose_Q: desgloseQCompra,
      desglose_CTA: desgloseCTACompra,
      CTA: CT_compra,
      pedidos_por_periodo: nPedidos,
    },
    produccionInterna: {
      Q_optima: Q_fab,
      desglose_D: desgloseDFab,
      desglose_H: desgloseHFab,
      desglose_factor: desgloseFactor,
      desglose_Q: desgloseQFab,
      desglose_CTA: desgloseCTAFab,
      CTA: CT_fab,
      corridas_por_periodo: nCorridas,
    },
    totales: {
      costo_global: decision.costoGlobal,
      recomendacion: decision.recomendacion,
      ahorro: decision.ahorro,
    },
  };
}
