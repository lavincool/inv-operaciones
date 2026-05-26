// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: EOQ BASICO CLASICO (Sin Escasez) con Punto de Reorden Complejo
//  ---------------------------------------------------------------------------
//  Calcula la Cantidad Economica de Pedido cuando la demanda es constante y no
//  se permite escasez. Incluye logica especial para el Punto de Reorden cuando
//  el Lead Time del proveedor supera el tiempo de ciclo del inventario.
// ══════════════════════════════════════════════════════════════════════════════

export interface EOQBasicoDesgloses {
  /** Desglose LaTeX del calculo de Q (Cantidad Optima) */
  Q: string;
  /** Desglose LaTeX del calculo de N (Numero de Pedidos) */
  N: string;
  /** Desglose LaTeX del calculo de CTA (Costo Total Anual) */
  CTA: string;
  /** Desglose LaTeX del calculo de PR (Punto de Reorden Complejo) */
  PR: string;
}

export interface EOQBasicoInput {
  /** Demanda total durante un año (unidades) */
  demandaAnual: number;
  /** Costo fijo por realizar una orden (moneda) */
  costoPedido: number;
  /** Costo de compra de un solo articulo (moneda) */
  costoUnitario: number;
  /** Tasa de mantenimiento anual (porcentaje en decimal, ej. 0.25) */
  tasaMantenimiento: number;
  /** Tiempo que tarda el proveedor en entregar (semanas) */
  tiempoEntrega: number;
}

export interface EOQBasicoOutput {
  /** Tamano del lote a pedir — Q optima */
  cantidadOptima: number;
  /** Veces al año que se ordena */
  numeroPedidos: number;
  /** Suma del costo de ordenar y mantener */
  costoTotal: number;
  /** Nivel de inventario de alerta para disparar una nueva orden */
  puntoReorden: number;
  /** Objeto con strings en sintaxis LaTeX mostrando la sustitucion paso a paso */
  desgloses: EOQBasicoDesgloses;
}

// ══════════════════════════════════════════════════════════════════════════════
//  VALIDACIONES
// ══════════════════════════════════════════════════════════════════════════════

function fmt(value: number, decimals = 4): string {
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORMULAS FUNDAMENTALES (puras, sin side effects)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Costo de Mantenimiento Anual (H) ────────────────────────────────────────

/**
 * Costo Anual de Mantenimiento por Unidad
 *
 *   H = i × C
 *
 * Donde:
 *   i = Tasa de mantenimiento anual (porcentaje expresado en decimal)
 *   C = Costo unitario del articulo (moneda)
 *
 * Este costo representa cuanto cuesta mantener UNA unidad almacenada durante
 * un año completo. Es el costo de oportunidad del capital invertido + costos
 * de almacenamiento, seguros, obsolescencia, etc.
 */
function costoMantenimientoAnual(
  tasaMantenimiento: number,
  costoUnitario: number,
): number {
  // Multiplicamos la tasa (ej. 0.25 = 25%) por el costo unitario.
  // Si mantener el 25% del valor de un articulo cuesta $200, entonces H = $50.
  return tasaMantenimiento * costoUnitario;
}

// ─── Cantidad Optima de Pedido (Q) ──────────────────────────────────────────

/**
 * Cantidad Economica de Pedido (EOQ) — Formula de Wilson
 *
 *            ┌───────────
 *           ╱  2 × D × S
 *   Q =    ╱   ─────────
 *        ╲╱        H
 *
 * Donde:
 *   D = Demanda anual (unidades)
 *   S = Costo por colocar un pedido (moneda)
 *   H = Costo anual de mantener una unidad en inventario (moneda)
 *
 * Esta formula encuentra el punto donde el costo de ordenar y el costo de
 * mantener se equilibran, minimizando el costo total del inventario.
 */
function cantidadOptimaPedido(
  demandaAnual: number,
  costoPedido: number,
  costoMantenimiento: number,
): number {
  // El numerador 2DS representa el "costo de ordenar escalado".
  // El denominador H representa el costo unitario de mantener.
  // La raiz cuadrada encuentra el balance optimo entre ambos costos.
  return Math.sqrt((2 * demandaAnual * costoPedido) / costoMantenimiento);
}

// ─── Numero de Pedidos al Ano (N) ────────────────────────────────────────────

/**
 * Numero de Pedidos por Ano
 *
 *          D
 *   N =  ───
 *          Q
 *
 * Donde:
 *   D = Demanda anual (unidades)
 *   Q = Cantidad optima de pedido (unidades)
 *
 * Indica cuántas órdenes se deben colocar durante el año. A mayor Q, menos
 * pedidos (y viceversa).
 */
function numeroPedidosAnual(demandaAnual: number, qOptima: number): number {
  // Dividir la demanda total entre el tamaño de cada lote nos da el número
  // de lotes (pedidos) necesarios para cubrir el año.
  return demandaAnual / qOptima;
}

// ─── Costo Total Anual (CTA) ────────────────────────────────────────────────

/**
 * Costo Total Anual del Inventario
 *
 *           D           Q
 *   CTA = ─── × S  +  ─── × H
 *           Q           2
 *          ↑              ↑
 *      costo de        costo de
 *       ordenar        mantener
 *
 * Donde:
 *   D = Demanda anual
 *   Q = Cantidad optima de pedido
 *   S = Costo por pedido
 *   H = Costo anual de mantener una unidad
 *
 * El CTA esta compuesto unicamente por dos terminos (no incluye el costo de
 * compra D×C porque es fijo para cualquier Q en el modelo clasico).
 */
function costoTotalAnualInventario(
  demandaAnual: number,
  qOptima: number,
  costoPedido: number,
  costoMantenimiento: number,
): number {
  // Termino 1: (D/Q) × S — Costo anual de colocar pedidos.
  //   Cuantos pedidos hago × cuanto cuesta cada pedido.
  // Termino 2: (Q/2) × H — Costo anual de mantener inventario.
  //   Inventario promedio (Q/2) × costo unitario de mantener.
  const costoOrdenar = (demandaAnual / qOptima) * costoPedido;
  const costoMantener = (qOptima / 2) * costoMantenimiento;
  return costoOrdenar + costoMantener;
}

// ─── Punto de Reorden Complejo (PR) ─────────────────────────────────────────

/**
 * Punto de Reorden Complejo — Maneja Lead Times mayores al ciclo de pedido.
 *
 * Este algoritmo en 5 pasos resuelve el caso en que el tiempo de entrega del
 * proveedor (L) es mayor que el tiempo que dura un ciclo de inventario (t).
 * En lugar de usar L directamente, se descuentan los ciclos completos que
 * "caben" dentro de L, quedandonos solo con el tiempo remanente (L_efectivo).
 *
 * Paso 5.1: Demanda semanal
 *   d_sem = D / 52
 *
 * Paso 5.2: Tiempo de ciclo en semanas
 *   t = Q / d_sem
 *
 * Paso 5.3: Ciclos completos en el Lead Time
 *   n = Math.floor(L / t)
 *
 * Paso 5.4: Lead Time efectivo (remanente)
 *   L_efectivo = L − (n × t)
 *
 * Paso 5.5: Punto de Reorden
 *   PR = d_sem × L_efectivo
 *
 * Donde:
 *   D    = Demanda anual (unidades)
 *   Q    = Cantidad optima de pedido (unidades)
 *   L    = Tiempo de entrega del proveedor (semanas)
 *   d_sem = Demanda semanal (unidades/semana)
 *   t    = Duracion de un ciclo de inventario (semanas)
 *   n    = Numero de ciclos completos que caben dentro de L
 *   L_efectivo = Tiempo restante despues de descontar ciclos completos
 *   PR   = Nivel de inventario al cual se debe emitir una nueva orden
 *
 * Razonamiento: Si el Lead Time es de 5 semanas pero el ciclo de inventario
 * solo dura 2.33 semanas, entonces durante las 5 semanas ocurren 2 ciclos
 * completos (4.66 semanas) mas un remanente de 0.34 semanas. El punto de
 * reorden solo necesita cubrir la demanda de esas 0.34 semanas restantes,
 * porque los ciclos completos ya estan cubiertos por pedidos anteriores.
 */
function puntoReordenComplejo(
  demandaAnual: number,
  qOptima: number,
  tiempoEntregaSemanas: number,
): number {
  // Paso 5.1 — Calcular la demanda semanal.
  // Asumimos 52 semanas por año (estándar en modelos de inventarios).
  // La demanda semanal es simplemente la demanda anual repartida entre 52.
  const d_sem = demandaAnual / 52;

  // Paso 5.2 — Calcular el tiempo de ciclo en semanas.
  // t = Q / d_sem responde: "¿cuántas semanas dura un lote de tamaño Q
  // si cada semana se consumen d_sem unidades?"
  const t = qOptima / d_sem;

  // Paso 5.3 — Determinar cuantos ciclos completos caben en el Lead Time.
  // Math.floor redondea hacia abajo porque solo nos interesan los ciclos
  // enteros que se completan dentro de L. Por ejemplo, si L=5 y t=2.33,
  // entonces n = floor(5/2.33) = floor(2.145) = 2 ciclos completos.
  const n = Math.floor(tiempoEntregaSemanas / t);

  // Paso 5.4 — Calcular el Lead Time efectivo.
  // Restamos la duracion de los n ciclos completos del tiempo de entrega
  // total. El resultado es el tiempo "sobrante" que realmente necesitamos
  // cubrir con inventario de seguridad + punto de reorden.
  // Siguiendo el ejemplo: L_efectivo = 5 - (2 × 2.33) = 5 - 4.66 = 0.34 sem.
  const L_efectivo = tiempoEntregaSemanas - n * t;

  // Paso 5.5 — Calcular el Punto de Reorden.
  // Multiplicamos la demanda semanal por el Lead Time efectivo. Esto nos da
  // el nivel de inventario en el cual debemos emitir una nueva orden para
  // que llegue justo cuando el inventario se agota (justo a tiempo).
  // PR = 115.38 unid/sem × 0.34 sem = 39.23 unidades ≈ 40 unidades.
  const PR = d_sem * L_efectivo;

  return PR;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCION PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function calculateEOQBasico(input: EOQBasicoInput): EOQBasicoOutput {
  const {
    demandaAnual,
    costoPedido,
    costoUnitario,
    tasaMantenimiento,
    tiempoEntrega,
  } = input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (demandaAnual <= 0) {
    throw new Error("La demanda anual debe ser mayor a cero.");
  }
  if (costoPedido <= 0) {
    throw new Error("El costo de pedido debe ser mayor a cero.");
  }
  if (costoUnitario <= 0) {
    throw new Error("El costo unitario debe ser mayor a cero.");
  }
  if (tasaMantenimiento <= 0) {
    throw new Error("La tasa de mantenimiento anual debe ser mayor a cero.");
  }
  if (tiempoEntrega < 0) {
    throw new Error("El tiempo de entrega no puede ser negativo.");
  }

  // ─── Calculos ─────────────────────────────────────────────────────────────

  // 1. Costo de Mantenimiento Anual: H = i × C
  const H = costoMantenimientoAnual(tasaMantenimiento, costoUnitario);

  // Validacion adicional: H no puede ser cero (evita division por cero en EOQ)
  if (H <= 0) {
    throw new Error("El costo de mantenimiento (H = i × C) debe ser mayor a cero.");
  }

  // 2. Cantidad Optima de Pedido: Q = √(2DS / H)
  const Q = cantidadOptimaPedido(demandaAnual, costoPedido, H);

  // 3. Numero de Pedidos por Ano: N = D / Q
  const N = numeroPedidosAnual(demandaAnual, Q);

  // 4. Costo Total Anual: CTA = (D/Q)×S + (Q/2)×H
  const CTA = costoTotalAnualInventario(demandaAnual, Q, costoPedido, H);

  // 5. Punto de Reorden Complejo (secuencia de 5 pasos)
  const PR = puntoReordenComplejo(demandaAnual, Q, tiempoEntrega);

  // ─── Generacion de desgloses en LaTeX ─────────────────────────────────────

  const d_sem = demandaAnual / 52;
  const t = Q / d_sem;
  const n = Math.floor(tiempoEntrega / t);
  const L_efectivo = tiempoEntrega - n * t;

  // Desglose de Q: Q = √(2DS / H)
  const desgloseQ =
    `Q = \\sqrt{\\frac{2 \\times D \\times S}{H}} = \\sqrt{\\frac{2 \\times ${demandaAnual.toFixed(0)} \\times ${fmt(costoPedido)}}{${fmt(H)}}} = ${fmt(Q)}`;

  // Desglose de N: N = D / Q
  const desgloseN =
    `N = \\frac{D}{Q} = \\frac{${demandaAnual.toFixed(0)}}{${fmt(Q)}} = ${fmt(N)}`;

  // Desglose de CTA: CTA = (D/Q)×S + (Q/2)×H
  const desgloseCTA =
    `CTA = \\left(\\frac{D}{Q}\\right) \\times S + \\left(\\frac{Q}{2}\\right) \\times H = \\left(\\frac{${demandaAnual.toFixed(0)}}{${fmt(Q)}}\\right)(${fmt(costoPedido)}) + \\left(\\frac{${fmt(Q)}}{2}\\right)(${fmt(H)}) = ${fmt(CTA)}`;

  // Desglose de PR (Punto de Reorden — 5 pasos)
  const desglosePR =
    `d_{\\text{sem}} = \\frac{D}{52} = \\frac{${demandaAnual.toFixed(0)}}{52} = ${fmt(d_sem)}\\\\` +
    `t = \\frac{Q}{d_{\\text{sem}}} = \\frac{${fmt(Q)}}{${fmt(d_sem)}} = ${fmt(t)}\\\\` +
    `n = \\left\\lfloor\\frac{L}{t}\\right\\rfloor = \\left\\lfloor\\frac{${fmt(tiempoEntrega)}}{${fmt(t)}}\\right\\rfloor = ${n}\\\\` +
    `L_{\\text{efectivo}} = L - (n \\times t) = ${fmt(tiempoEntrega)} - (${n} \\times ${fmt(t)}) = ${fmt(L_efectivo)}\\\\` +
    `PR = d_{\\text{sem}} \\times L_{\\text{efectivo}} = ${fmt(d_sem)} \\times ${fmt(L_efectivo)} = ${fmt(PR)}`;

  return {
    cantidadOptima: Q,
    numeroPedidos: N,
    costoTotal: CTA,
    puntoReorden: PR,
    desgloses: {
      Q: desgloseQ,
      N: desgloseN,
      CTA: desgloseCTA,
      PR: desglosePR,
    },
  };
}
