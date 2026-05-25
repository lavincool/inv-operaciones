// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: EOQ CON DESCUENTOS POR CANTIDAD
//  ---------------------------------------------------------------------------
//  Calcula la cantidad óptima de pedido cuando el proveedor ofrece precios
//  escalonados según el volumen comprado.
// ══════════════════════════════════════════════════════════════════════════════

export interface RangoPrecio {
  min: number;
  max: number | null;
  precioUnitario: number;
}

export interface EOQDiscountInput {
  demandaAnual: number;
  costoPedido: number;
  tasaMantenimiento: number;
  costoMantenimientoConstante: boolean;
  rangos: RangoPrecio[];
}

export interface DesgloseRango {
  rangoTexto: string;
  qCalculada: number;
  qAjustada: number;
  costoCompra: number;
  costoPedido: number;
  costoMantenimiento: number;
  costoTotalAnual: number;
  esOptimo: boolean;
}

export interface EOQDiscountOutput {
  cantidadOptima: number;
  costoTotalMinimo: number;
  desglose: DesgloseRango[];
}

// ══════════════════════════════════════════════════════════════════════════════
//  FÓRMULAS FUNDAMENTALES (puras, sin side effects)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Costo de mantenimiento ──────────────────────────────────────────────────

/**
 * Costo de mantener una unidad en inventario por un año
 *
 *   H = i × C
 *
 * i = tasa de mantenimiento anual
 * C = precio unitario del rango
 */
function costoMantenimiento(tasa: number, precioUnitario: number): number {
  return tasa * precioUnitario;
}

// ─── EOQ teórico ────────────────────────────────────────────────────────────

/**
 * Cantidad Económica de Pedido (EOQ) — valor teórico sin restricciones
 *
 *            ┌───────────
 *           ╱  2 × D × S
 *   Q =    ╱   ─────────
 *        ╲╱        H
 *
 * D = demanda anual
 * S = costo de pedido
 * H = costo de mantenimiento por unidad por año
 */
function eoq(demanda: number, costoPedido: number, h: number): number {
  return Math.sqrt((2 * demanda * costoPedido) / h);
}

// ─── Ajuste de Q al rango ───────────────────────────────────────────────────

/**
 * Ajusta Q al rango de precios [min, max]
 *
 *   Si Q < min  →  Q_ajustada = min         (pedir el mínimo del rango)
 *   Si min ≤ Q ≤ max  →  Q_ajustada = Q     (Q es factible en este rango)
 *   Si Q > max  →  descartado               (Q queda fuera del rango)
 */
function ajustarQ(q: number, min: number, max: number | null): { q: number; valido: boolean } {
  if (q < min) return { q: min, valido: true };
  if (max !== null && q > max) return { q: 0, valido: false };
  return { q, valido: true };
}

// ─── Componentes del Costo Total Anual ─────────────────────────────────────

/**
 * Costo de compra anual
 *
 *   C_compra = D × C
 *
 * D = demanda anual
 * C = precio unitario del rango
 */
function costoCompraAnual(demanda: number, precioUnitario: number): number {
  return demanda * precioUnitario;
}

/**
 * Costo de pedir (ordenar) anual
 *
 *              D
 *   C_pedido = ─── × S
 *              Q
 *
 * D = demanda anual
 * Q = cantidad ajustada a pedir
 * S = costo de cada pedido
 */
function costoPedidoAnual(demanda: number, q: number, costoPedido: number): number {
  return (demanda / q) * costoPedido;
}

/**
 * Costo de mantenimiento anual
 *
 *              Q
 *   C_mant = ─── × H
 *              2
 *
 * Q = cantidad ajustada a pedir
 * H = costo de mantenimiento por unidad por año
 */
function costoMantenimientoAnual(q: number, h: number): number {
  return (q / 2) * h;
}

/**
 * Costo Total Anual (CTA)
 *
 *   CTA = D×C  +  (D/Q)×S  +  (Q/2)×H
 *         ↑          ↑            ↑
 *       compra     pedir       mantener
 */
function costoTotalAnual(
  cCompra: number,
  cPedido: number,
  cMantenimiento: number,
): number {
  return cCompra + cPedido + cMantenimiento;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function calculateEOQDiscount(input: EOQDiscountInput): EOQDiscountOutput {
  const { demandaAnual, costoPedido, tasaMantenimiento, costoMantenimientoConstante, rangos } =
    input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (rangos.length === 0) {
    throw new Error("Debe proporcionar al menos un rango de precio.");
  }

  if (demandaAnual <= 0 || costoPedido <= 0 || tasaMantenimiento <= 0) {
    throw new Error(
      "La demanda, el costo de pedido y la tasa de mantenimiento deben ser mayores a cero.",
    );
  }

  // ─── Ordenar rangos y determinar H base ───────────────────────────────────

  const rangosOrdenados = [...rangos].sort((a, b) => a.min - b.min);

  // H_base = i × C_primer_rango (se usa cuando costoMantenimientoConstante = true)
  const precioBase = rangosOrdenados[0].precioUnitario;
  const HBase = costoMantenimiento(tasaMantenimiento, precioBase);

  // ─── Evaluar cada rango ───────────────────────────────────────────────────

  const desglose: DesgloseRango[] = rangosOrdenados.map((rango) => {
    //   H = i × C_rango     o     H = i × C_base  (según configuración)
    const H = costoMantenimientoConstante
      ? HBase
      : costoMantenimiento(tasaMantenimiento, rango.precioUnitario);

    //   Q = √(2·D·S / H)
    const Q_calc = eoq(demandaAnual, costoPedido, H);

    //   Ajustar Q al rango [min, max]
    const { q: Q_ajust, valido } = ajustarQ(Q_calc, rango.min, rango.max);

    //   Componentes del CTA:
    //     C_compra = D × C_rango
    //     C_pedido  = (D/Q) × S
    //     C_mant    = (Q/2) × H
    const cCompra = costoCompraAnual(demandaAnual, rango.precioUnitario);
    const cPedido = valido ? costoPedidoAnual(demandaAnual, Q_ajust, costoPedido) : 0;
    const cMantenimiento = valido ? costoMantenimientoAnual(Q_ajust, H) : 0;

    //   CTA = C_compra + C_pedido + C_mant
    const cta = valido ? costoTotalAnual(cCompra, cPedido, cMantenimiento) : Infinity;

    const rangoTexto = rango.max !== null
      ? `${rango.min} – ${rango.max}`
      : `${rango.min}+`;

    return {
      rangoTexto,
      qCalculada: Q_calc,
      qAjustada: valido ? Q_ajust : 0,
      costoCompra: cCompra,
      costoPedido: cPedido,
      costoMantenimiento: cMantenimiento,
      costoTotalAnual: cta,
      esOptimo: false,
    };
  });

  // ─── Seleccionar el rango con menor CTA ───────────────────────────────────

  const minCost = Math.min(...desglose.map((d) => d.costoTotalAnual));
  const optimalIndex = desglose.findIndex((d) => d.costoTotalAnual === minCost);

  if (optimalIndex >= 0) {
    desglose[optimalIndex].esOptimo = true;
  }

  return {
    cantidadOptima: optimalIndex >= 0 ? desglose[optimalIndex].qAjustada : 0,
    costoTotalMinimo: minCost,
    desglose,
  };
}
