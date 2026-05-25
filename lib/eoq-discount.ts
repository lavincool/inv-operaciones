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

/**
 * Resuelve el Modelo de Inventarios EOQ con Descuentos por Cantidad.
 *
 * Soporta dos variantes del costo de mantenimiento (H):
 * - Variable por rango: H = tasaMantenimiento * precioUnitario del rango.
 * - Constante (precio base): H = tasaMantenimiento * precio del primer rango,
 *   usado para todos los rangos.
 *
 * Pasos del algoritmo:
 * 1. Determinar H segun el flag costoMantenimientoConstante.
 * 2. Calcular Q teorica con la formula EOQ clasica.
 * 3. Ajustar Q al limite inferior del rango si es menor, o descartar si excede el maximo.
 * 4. Calcular Costo Total Anual (CTA) para cada Q ajustada.
 * 5. Seleccionar el rango con menor CTA como optimo.
 */
export function calculateEOQDiscount(input: EOQDiscountInput): EOQDiscountOutput {
  const { demandaAnual, costoPedido, tasaMantenimiento, costoMantenimientoConstante, rangos } =
    input;

  if (rangos.length === 0) {
    throw new Error("Debe proporcionar al menos un rango de precio.");
  }

  if (demandaAnual <= 0 || costoPedido <= 0 || tasaMantenimiento <= 0) {
    throw new Error(
      "La demanda, el costo de pedido y la tasa de mantenimiento deben ser mayores a cero.",
    );
  }

  // Ordenar rangos por limite inferior para consistencia
  const rangosOrdenados = [...rangos].sort((a, b) => a.min - b.min);
  const precioBase = rangosOrdenados[0].precioUnitario;

  // H base para el caso de costo de mantenimiento constante
  const HBase = tasaMantenimiento * precioBase;

  const desglose: DesgloseRango[] = rangosOrdenados.map((rango) => {
    // Paso 1: Determinar H
    const H = costoMantenimientoConstante ? HBase : tasaMantenimiento * rango.precioUnitario;

    // Paso 2: Q teorica
    const qCalculada = Math.sqrt((2 * demandaAnual * costoPedido) / H);

    // Paso 3: Validar y ajustar Q
    let qAjustada = qCalculada;
    let esValido = true;

    if (qCalculada < rango.min) {
      qAjustada = rango.min;
    } else if (rango.max !== null && qCalculada > rango.max) {
      esValido = false;
    }

    // Paso 4: Calcular CTA
    const cCompra = demandaAnual * rango.precioUnitario;
    const cPedido = esValido ? (demandaAnual / qAjustada) * costoPedido : 0;
    const cMantenimiento = esValido ? (qAjustada / 2) * H : 0;
    const costoTotalAnual = esValido ? cCompra + cPedido + cMantenimiento : Infinity;

    const rangoTexto = rango.max !== null ? `${rango.min} – ${rango.max}` : `${rango.min}+`;

    return {
      rangoTexto,
      qCalculada,
      qAjustada: esValido ? qAjustada : 0,
      costoCompra: cCompra,
      costoPedido: cPedido,
      costoMantenimiento: cMantenimiento,
      costoTotalAnual,
      esOptimo: false,
    };
  });

  // Paso 5: Seleccionar el optimo
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
