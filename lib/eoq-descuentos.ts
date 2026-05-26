// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: EOQ CON DESCUENTOS POR CANTIDAD (Caso simple)
//  ---------------------------------------------------------------------------
//  Evalúa si conviene aceptar un descuento del proveedor aumentando el tamaño
//  del pedido. Compara el Costo Total Anual (incluyendo compra de material)
//  entre la cantidad optima base (a precio normal) y el umbral minimo exigido
//  (con precio con descuento).
// ══════════════════════════════════════════════════════════════════════════════

export interface EOQDescuentosDesgloses {
  /** Desglose LaTeX del calculo de Q* (cantidad optima sin descuento) */
  Q1: string;
  /** Desglose LaTeX del CTA sin descuento — evaluado en Q* y precio normal */
  CTA1: string;
  /** Desglose LaTeX del CTA con descuento — evaluado en q_min y precio descuento */
  CTA2: string;
}

export interface EOQDescuentosInput {
  /** Demanda total durante un año (unidades) */
  demandaAnual: number;
  /** Costo fijo por realizar una orden (moneda) */
  costoPedido: number;
  /** Tasa de mantenimiento anual (porcentaje en decimal, ej. 0.20) */
  tasaMantenimiento: number;
  /** Precio unitario normal (moneda) */
  precioNormal: number;
  /** Precio unitario con descuento (moneda) — debe ser menor al normal */
  precioDescuento: number;
  /** Cantidad minima requerida para acceder al descuento (unidades) */
  umbralDescuento: number;
}

export interface EOQDescuentosOutput {
  /** Cantidad optima de pedido sin descuento (Q*) */
  cantidadOptima1: number;
  /** Costo total anual evaluado en Q* con precio normal */
  costoTotal1: number;
  /** Costo total anual evaluado en el umbral de descuento con precio descuento */
  costoTotal2: number;
  /** Mensaje con la decision: aceptar o rechazar el descuento */
  decision: string;
  /** true si conviene aceptar el descuento */
  convieneDescuento: boolean;
  /** Objeto con strings LaTeX mostrando las sustituciones paso a paso */
  desgloses: EOQDescuentosDesgloses;
}

// ══════════════════════════════════════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════════════════════════════════════

function f4(value: number): string {
  return value.toFixed(4);
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORMULAS FUNDAMENTALES (puras, sin side effects)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Costo de Mantenimiento Anual (H) ────────────────────────────────────────

/**
 * Costo Anual de Mantenimiento por Unidad
 *
 *   H = i x C
 *
 * Donde:
 *   i = Tasa de mantenimiento anual (porcentaje expresado en decimal)
 *   C = Precio unitario del articulo (moneda)
 */
function costoMantenimientoAnual(
  tasaMantenimiento: number,
  precioUnitario: number,
): number {
  return tasaMantenimiento * precioUnitario;
}

// ─── Cantidad Optima de Pedido (Q*) ──────────────────────────────────────────

/**
 * Cantidad Economica de Pedido (EOQ) — Formula de Wilson
 *
 *            ┌───────────
 *           ╱  2 x D x S
 *   Q* =   ╱   ─────────
 *        ╲╱        H
 *
 * Donde:
 *   D = Demanda anual (unidades)
 *   S = Costo por colocar un pedido (moneda)
 *   H = Costo anual de mantener una unidad en inventario (moneda)
 */
function cantidadOptimaPedido(
  demandaAnual: number,
  costoPedido: number,
  costoMantenimiento: number,
): number {
  return Math.sqrt((2 * demandaAnual * costoPedido) / costoMantenimiento);
}

// ─── Costo Total Anual (CTA) — Incluye costo de adquisicion ──────────────────

/**
 * Costo Total Anual del Inventario (incluye compra de material)
 *
 *            D             Q
 *   CTA = D x C  +  ─── x S  +  ─── x H
 *                    Q             2
 *          ↑           ↑            ↑
 *        compra      pedir       mantener
 *
 * Donde:
 *   D = Demanda anual
 *   C = Precio unitario
 *   Q = Cantidad a pedir
 *   S = Costo por pedido
 *   H = Costo anual de mantener una unidad
 *
 * Nota: A diferencia del EOQ clasico, aqui SI se incluye D x C porque
 * el precio unitario cambia entre los dos escenarios y es necesario
 * para que la comparacion tenga sentido economico.
 */
function costoTotalAnual(
  demandaAnual: number,
  q: number,
  costoPedido: number,
  costoMantenimiento: number,
  precioUnitario: number,
): number {
  const costoCompra = demandaAnual * precioUnitario;
  const costoOrdenar = (demandaAnual / q) * costoPedido;
  const costoMantener = (q / 2) * costoMantenimiento;
  return costoCompra + costoOrdenar + costoMantener;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCION PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function calculateEOQDescuentos(input: EOQDescuentosInput): EOQDescuentosOutput {
  const {
    demandaAnual,
    costoPedido,
    tasaMantenimiento,
    precioNormal,
    precioDescuento,
    umbralDescuento,
  } = input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (demandaAnual <= 0) {
    throw new Error("La demanda anual debe ser mayor a cero.");
  }
  if (costoPedido <= 0) {
    throw new Error("El costo de pedido debe ser mayor a cero.");
  }
  if (tasaMantenimiento <= 0) {
    throw new Error("La tasa de mantenimiento debe ser mayor a cero.");
  }
  if (precioNormal <= 0) {
    throw new Error("El precio normal debe ser mayor a cero.");
  }
  if (precioDescuento <= 0) {
    throw new Error("El precio con descuento debe ser mayor a cero.");
  }
  if (precioDescuento >= precioNormal) {
    throw new Error("El precio con descuento debe ser menor al precio normal.");
  }
  if (umbralDescuento <= 0) {
    throw new Error("El umbral de descuento debe ser mayor a cero.");
  }

  // ─── Calculos ─────────────────────────────────────────────────────────────

  // 1. Costo de Mantenimiento Anual — H = i x C
  const H1 = costoMantenimientoAnual(tasaMantenimiento, precioNormal);
  const H2 = costoMantenimientoAnual(tasaMantenimiento, precioDescuento);

  // Validacion adicional: H no puede ser cero
  if (H1 <= 0 || H2 <= 0) {
    throw new Error("El costo de mantenimiento (H = i x C) debe ser mayor a cero.");
  }

  // 2. Cantidad Optima de Pedido sin descuento: Q* = sqrt(2DS / H1)
  const Q1 = cantidadOptimaPedido(demandaAnual, costoPedido, H1);

  // 3. Costo Total Anual — Escenario 1: precio normal con Q*
  const CTA1 = costoTotalAnual(demandaAnual, Q1, costoPedido, H1, precioNormal);

  // 4. Costo Total Anual — Escenario 2: precio descuento con q_min
  //    (para acceder al descuento se debe pedir al menos el umbral)
  const CTA2 = costoTotalAnual(demandaAnual, umbralDescuento, costoPedido, H2, precioDescuento);

  // ─── Decision ────────────────────────────────────────────────────────────

  const convieneDescuento = CTA2 < CTA1;
  const decision = convieneDescuento
    ? `Si conviene aceptar el descuento (${f4(CTA2)} < ${f4(CTA1)})`
    : `No conviene aceptar el descuento (${f4(CTA1)} < ${f4(CTA2)})`;

  // ─── Generacion de desgloses en LaTeX ─────────────────────────────────────

  const desgloseQ1 =
    `Q^* = \\sqrt{\\frac{2 \\times D \\times S}{H_1}} = \\sqrt{\\frac{2 \\times ${demandaAnual.toFixed(0)} \\times ${f4(costoPedido)}}{${f4(H1)}}} = ${f4(Q1)}`;

  const desgloseCTA1 =
    `CTA_1 = D \\cdot C_1 + \\frac{D}{Q^*} \\cdot S + \\frac{Q^*}{2} \\cdot H_1 = ${demandaAnual.toFixed(0)} \\cdot ${f4(precioNormal)} + \\frac{${demandaAnual.toFixed(0)}}{${f4(Q1)}} \\cdot ${f4(costoPedido)} + \\frac{${f4(Q1)}}{2} \\cdot ${f4(H1)} = ${f4(CTA1)}`;

  const desgloseCTA2 =
    `CTA_2 = D \\cdot C_2 + \\frac{D}{q_{\\text{min}}} \\cdot S + \\frac{q_{\\text{min}}}{2} \\cdot H_2 = ${demandaAnual.toFixed(0)} \\cdot ${f4(precioDescuento)} + \\frac{${demandaAnual.toFixed(0)}}{${f4(umbralDescuento)}} \\cdot ${f4(costoPedido)} + \\frac{${f4(umbralDescuento)}}{2} \\cdot ${f4(H2)} = ${f4(CTA2)}`;

  return {
    cantidadOptima1: Q1,
    costoTotal1: CTA1,
    costoTotal2: CTA2,
    decision,
    convieneDescuento,
    desgloses: {
      Q1: desgloseQ1,
      CTA1: desgloseCTA1,
      CTA2: desgloseCTA2,
    },
  };
}
