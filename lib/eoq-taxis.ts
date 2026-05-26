// ══════════════════════════════════════════════════════════════════════════════
//  MODELO: EOQ AVANZADO (Basico, Escasez y Descuentos)
//  ---------------------------------------------------------------------------
//  Calcula la Cantidad Optima de Pedido evaluando escenarios sin faltantes,
//  con escasez permitida y con descuentos por volumen, utilizando tasas
//  mensuales. Todas las unidades de tiempo estan estandarizadas en MESES.
// ══════════════════════════════════════════════════════════════════════════════

export interface EOQTaxisDesgloses {
  /** Desglose LaTeX del calculo de Q (Cantidad Optima) */
  Q: string;
  /** Desglose LaTeX del calculo de S_m (Inventario Maximo) — solo si hay escasez */
  Sm?: string;
  /** Desglose LaTeX del calculo de w (Faltante Maximo) — solo si hay escasez */
  w?: string;
  /** Desglose LaTeX del calculo de t (Tiempo Total entre Ordenes) */
  t: string;
  /** Desglose LaTeX del calculo de t_1 (Tiempo de Inventario Positivo) — solo si hay escasez */
  t1?: string;
  /** Desglose LaTeX del calculo de t_2 (Tiempo de Agotamiento) — solo si hay escasez */
  t2?: string;
}

export interface EOQTaxisInput {
  /** Tasa de consumo o demanda (galones/mes) */
  demandaMensual: number;
  /** Costo fijo por ordenar ($/orden) */
  costoOrden: number;
  /** Costo de mantener inventario ($/unidad/mes) */
  costoMantener: number;
  /** Costo por faltantes ($/unidad/mes) — opcional, si es 0 no hay escasez */
  costoEscasez: number;
  /** Nuevo costo de mantener tras descuento ($/unidad/mes) — opcional, si es 0 se ignora */
  costoMantenerDescuento: number;
}

export interface EOQTaxisOutput {
  /** Tamano del lote a pedir — Q optima */
  cantidadOptima: number;
  /** Stock maximo — solo si hay escasez */
  inventarioMaximo: number | null;
  /** Agotamiento maximo — solo si hay escasez */
  faltanteMaximo: number | null;
  /** Tiempo total del ciclo (meses) */
  tiempoEntreOrdenes: number;
  /** Tiempo con stock (meses) — solo si hay escasez */
  tiempoInventario: number | null;
  /** Tiempo en escasez (meses) — solo si hay escasez */
  tiempoFaltante: number | null;
  /** Objeto con strings LaTeX mostrando la sustitucion paso a paso */
  desgloses: EOQTaxisDesgloses;
  /** Escenario aplicado: "basico", "escasez", "descuento" o "escasez_descuento" */
  tipo: "basico" | "escasez" | "descuento" | "escasez_descuento";
  /** Costo de mantener efectivo utilizado en los calculos */
  hEfectivo: number;
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

// ─── Cantidad Optima — EOQ Basico ───────────────────────────────────────────

/**
 * Cantidad Optima de Pedido (EOQ Basico — sin escasez)
 *
 *            ┌───────────
 *           ╱  2 × d × s
 *   Q =    ╱   ─────────
 *        ╲╱        h
 *
 * Donde:
 *   d = Demanda mensual (galones/mes)
 *   s = Costo fijo por ordenar ($/orden)
 *   h = Costo de mantener inventario ($/unidad/mes)
 */
function cantidadOptimaBasico(
  demandaMensual: number,
  costoOrden: number,
  costoMantener: number,
): number {
  return Math.sqrt((2 * demandaMensual * costoOrden) / costoMantener);
}

// ─── Cantidad Optima — EOQ con Escasez ─────────────────────────────────────

/**
 * Cantidad Optima de Pedido (EOQ con Agotamiento Permitido)
 *
 *            ┌───────────────────
 *           ╱  2 × d × s × (h + p)
 *   Q =    ╱   ───────────────────
 *        ╲╱          h × p
 *
 * Donde:
 *   d = Demanda mensual (galones/mes)
 *   s = Costo fijo por ordenar ($/orden)
 *   h = Costo de mantener inventario ($/unidad/mes)
 *   p = Costo por faltantes ($/unidad/mes)
 */
function cantidadOptimaEscasez(
  demandaMensual: number,
  costoOrden: number,
  costoMantener: number,
  costoEscasez: number,
): number {
  return Math.sqrt(
    (2 * demandaMensual * costoOrden * (costoMantener + costoEscasez)) /
      (costoMantener * costoEscasez),
  );
}

// ─── Inventario Maximo (S_m) ───────────────────────────────────────────────

/**
 * Inventario Maximo (Stock Maximo)
 *
 *                  p
 *   S_m = Q × ( ─────── )
 *               h + p
 *
 * Donde:
 *   Q = Cantidad optima de pedido
 *   h = Costo de mantener inventario
 *   p = Costo por faltantes
 */
function inventarioMaximo(
  qOptima: number,
  costoMantener: number,
  costoEscasez: number,
): number {
  return qOptima * (costoEscasez / (costoMantener + costoEscasez));
}

// ─── Faltante Maximo (w) ───────────────────────────────────────────────────

/**
 * Agotamiento Maximo (Faltante)
 *
 *                  h
 *   w = Q × ( ─────── )
 *               h + p
 *
 * Donde:
 *   Q = Cantidad optima de pedido
 *   h = Costo de mantener inventario
 *   p = Costo por faltantes
 */
function faltanteMaximo(
  qOptima: number,
  costoMantener: number,
  costoEscasez: number,
): number {
  return qOptima * (costoMantener / (costoMantener + costoEscasez));
}

// ─── Tiempo Total entre Ordenes (t) ───────────────────────────────────────

/**
 * Tiempo Total entre Ordenes
 *
 *         Q
 *   t = ─────
 *         d
 *
 * Donde:
 *   Q = Cantidad optima de pedido
 *   d = Demanda mensual
 */
function tiempoTotal(qOptima: number, demandaMensual: number): number {
  return qOptima / demandaMensual;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FUNCION PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export function calculateEOQTaxis(input: EOQTaxisInput): EOQTaxisOutput {
  const {
    demandaMensual,
    costoOrden,
    costoMantener,
    costoEscasez,
    costoMantenerDescuento,
  } = input;

  // ─── Validaciones ─────────────────────────────────────────────────────────

  if (demandaMensual <= 0) {
    throw new Error("La demanda mensual debe ser mayor a cero.");
  }
  if (costoOrden <= 0) {
    throw new Error("El costo de orden debe ser mayor a cero.");
  }
  if (costoMantener <= 0) {
    throw new Error("El costo de mantener debe ser mayor a cero.");
  }
  if (costoEscasez < 0) {
    throw new Error("El costo de escasez no puede ser negativo.");
  }
  if (costoMantenerDescuento < 0) {
    throw new Error("El costo de mantener con descuento no puede ser negativo.");
  }

  // ─── Determinacion de h efectivo ──────────────────────────────────────────

  const hEfectivo =
    costoMantenerDescuento > 0 ? costoMantenerDescuento : costoMantener;

  if (hEfectivo <= 0) {
    throw new Error("El costo de mantener efectivo debe ser mayor a cero.");
  }

  // ─── Determinacion del escenario ──────────────────────────────────────────

  const hayEscasez = costoEscasez > 0;
  const hayDescuento = costoMantenerDescuento > 0;

  let tipo: EOQTaxisOutput["tipo"];
  if (hayEscasez && hayDescuento) {
    tipo = "escasez_descuento";
  } else if (hayEscasez) {
    tipo = "escasez";
  } else if (hayDescuento) {
    tipo = "descuento";
  } else {
    tipo = "basico";
  }

  // ─── Calculos ─────────────────────────────────────────────────────────────

  let Q: number;
  if (hayEscasez) {
    Q = cantidadOptimaEscasez(demandaMensual, costoOrden, hEfectivo, costoEscasez);
  } else {
    Q = cantidadOptimaBasico(demandaMensual, costoOrden, hEfectivo);
  }

  const t = tiempoTotal(Q, demandaMensual);

  let Sm: number | null = null;
  let w: number | null = null;
  let t1: number | null = null;
  let t2: number | null = null;

  if (hayEscasez) {
    Sm = inventarioMaximo(Q, hEfectivo, costoEscasez);
    w = faltanteMaximo(Q, hEfectivo, costoEscasez);
    t1 = tiempoTotal(Sm, demandaMensual);
    t2 = tiempoTotal(w, demandaMensual);
  }

  // ─── Generacion de desgloses en LaTeX ─────────────────────────────────────

  if (hayEscasez) {
    const desgloseQ =
      `Q = \\sqrt{\\frac{2 \\times d \\times s \\times (h + p)}{h \\times p}} = \\sqrt{\\frac{2 \\times ${demandaMensual.toFixed(0)} \\times ${fmt(costoOrden)} \\times (${fmt(hEfectivo)} + ${fmt(costoEscasez)})}{${fmt(hEfectivo)} \\times ${fmt(costoEscasez)}}} = ${fmt(Q)}`;

    const desgloseSm =
      `S_m = Q \\times \\left(\\frac{p}{h + p}\\right) = ${fmt(Q)} \\times \\left(\\frac{${fmt(costoEscasez)}}{${fmt(hEfectivo)} + ${fmt(costoEscasez)}}\\right) = ${fmt(Sm!)}`;

    const desgloseW =
      `w = Q \\times \\left(\\frac{h}{h + p}\\right) = ${fmt(Q)} \\times \\left(\\frac{${fmt(hEfectivo)}}{${fmt(hEfectivo)} + ${fmt(costoEscasez)}}\\right) = ${fmt(w!)}`;

    const desgloseT =
      `t = \\frac{Q}{d} = \\frac{${fmt(Q)}}{${demandaMensual.toFixed(0)}} = ${fmt(t)}`;

    const desgloseT1 =
      `t_1 = \\frac{S_m}{d} = \\frac{${fmt(Sm!)}}{${demandaMensual.toFixed(0)}} = ${fmt(t1!)}`;

    const desgloseT2 =
      `t_2 = \\frac{w}{d} = \\frac{${fmt(w!)}}{${demandaMensual.toFixed(0)}} = ${fmt(t2!)}`;

    return {
      cantidadOptima: Q,
      inventarioMaximo: Sm,
      faltanteMaximo: w,
      tiempoEntreOrdenes: t,
      tiempoInventario: t1,
      tiempoFaltante: t2,
      hEfectivo,
      tipo,
      desgloses: {
        Q: desgloseQ,
        Sm: desgloseSm,
        w: desgloseW,
        t: desgloseT,
        t1: desgloseT1,
        t2: desgloseT2,
      },
    };
  }

  // ─── Escenario sin escasez ────────────────────────────────────────────────

  const desgloseQ =
    `Q = \\sqrt{\\frac{2 \\times d \\times s}{h}} = \\sqrt{\\frac{2 \\times ${demandaMensual.toFixed(0)} \\times ${fmt(costoOrden)}}{${fmt(hEfectivo)}}} = ${fmt(Q)}`;

  const desgloseT =
    `t = \\frac{Q}{d} = \\frac{${fmt(Q)}}{${demandaMensual.toFixed(0)}} = ${fmt(t)}`;

  return {
    cantidadOptima: Q,
    inventarioMaximo: null,
    faltanteMaximo: null,
    tiempoEntreOrdenes: t,
    tiempoInventario: null,
    tiempoFaltante: null,
    hEfectivo,
    tipo,
    desgloses: {
      Q: desgloseQ,
      t: desgloseT,
    },
  };
}
