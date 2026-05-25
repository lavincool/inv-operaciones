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

function f2(value: number): string {
  return value.toFixed(2);
}

/**
 * Calcula la decision de Fabricar o Comprar (Make vs. Buy)
 * utilizando los modelos EOQ (Proveedor Externo) y EPQ (Produccion Interna).
 *
 * Soporta periodo "anual" (D x 12, H = i*C) o "mensual" (D directa, H = (i/12)*C).
 * Q optima es invariante al periodo, el CTA escala proporcionalmente.
 */
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
  const factorD = esAnual ? 12 : 1;
  const factorH = esAnual ? 1 : 1 / 12;
  const etiquetaPeriodo = esAnual ? "anual" : "mensual";
  const etiquetaCosto = esAnual ? "CTA" : "CTM";

  // --- Proveedor externo (EOQ) ---
  const demandaMensualCompra = demandaTotalMensual * porcentajeCompra;
  const DCompra = demandaMensualCompra * factorD;
  const HCompra = tasaMantenimientoAnual * costoUnitarioCompra * factorH;

  const desgloseDCompra = esAnual
    ? `D_{\\text{anual, compra}} = (${demandaTotalMensual} \\times ${f2(porcentajeCompra)}) \\times 12 = ${DCompra.toFixed(0)}`
    : `D_{\\text{mensual, compra}} = ${demandaTotalMensual} \\times ${f2(porcentajeCompra)} = ${DCompra.toFixed(0)}`;

  const desgloseHCompra = esAnual
    ? `H_{\\text{compra}} = i \\times C_{\\text{compra}} = ${f2(tasaMantenimientoAnual)} \\times ${f2(costoUnitarioCompra)} = ${f2(HCompra)}`
    : `H_{\\text{compra}} = \\frac{i}{12} \\times C_{\\text{compra}} = \\frac{${f2(tasaMantenimientoAnual)}}{12} \\times ${f2(costoUnitarioCompra)} = ${f2(HCompra)}`;

  const qOptimaCompra = Math.sqrt((2 * DCompra * costoPedidoCompra) / HCompra);

  const desgloseQCompra =
    `Q_{\\text{ext}} = \\sqrt{\\frac{2 \\times ${DCompra.toFixed(0)} \\times ${f2(costoPedidoCompra)}}{${f2(HCompra)}}} = ${f2(qOptimaCompra)}`;

  const costoTotalPeriodoCompra =
    (DCompra / qOptimaCompra) * costoPedidoCompra + (qOptimaCompra / 2) * HCompra;

  const desgloseCTACompra =
    `${etiquetaCosto}_{\\text{ext}} = \\left(\\frac{${DCompra.toFixed(0)}}{${f2(qOptimaCompra)}}\\right)(${f2(costoPedidoCompra)}) + \\left(\\frac{${f2(qOptimaCompra)}}{2}\\right)(${f2(HCompra)}) = ${f2(costoTotalPeriodoCompra)}`;

  const pedidosPorPeriodo = DCompra / qOptimaCompra;

  // --- Produccion interna (EPQ) ---
  const demandaMensualFab = demandaTotalMensual * porcentajeFabricacion;
  const DFab = demandaMensualFab * factorD;
  const HFab = tasaMantenimientoAnual * costoUnitarioFab * factorH;
  const factorProduccion = 1 - (demandaMensualFab / capacidadProduccionMensual);

  const desgloseDFab = esAnual
    ? `D_{\\text{anual, fab}} = (${demandaTotalMensual} \\times ${f2(porcentajeFabricacion)}) \\times 12 = ${DFab.toFixed(0)}`
    : `D_{\\text{mensual, fab}} = ${demandaTotalMensual} \\times ${f2(porcentajeFabricacion)} = ${DFab.toFixed(0)}`;

  const desgloseHFab = esAnual
    ? `H_{\\text{fab}} = i \\times C_{\\text{fab}} = ${f2(tasaMantenimientoAnual)} \\times ${f2(costoUnitarioFab)} = ${f2(HFab)}`
    : `H_{\\text{fab}} = \\frac{i}{12} \\times C_{\\text{fab}} = \\frac{${f2(tasaMantenimientoAnual)}}{12} \\times ${f2(costoUnitarioFab)} = ${f2(HFab)}`;

  const desgloseFactor =
    `1 - \\frac{d}{p} = 1 - \\frac{${demandaMensualFab.toFixed(0)}}{${capacidadProduccionMensual.toFixed(0)}} = ${f2(factorProduccion)}`;

  const qOptimaFab = Math.sqrt((2 * DFab * costoPreparacionFab) / (HFab * factorProduccion));

  const desgloseQFab =
    `Q_{\\text{int}} = \\sqrt{\\frac{2 \\times ${DFab.toFixed(0)} \\times ${f2(costoPreparacionFab)}}{${f2(HFab)} \\times ${f2(factorProduccion)}}} = ${f2(qOptimaFab)}`;

  const costoTotalPeriodoFab =
    (DFab / qOptimaFab) * costoPreparacionFab + (qOptimaFab / 2) * HFab * factorProduccion;

  const desgloseCTAFab =
    `${etiquetaCosto}_{\\text{int}} = \\left(\\frac{${DFab.toFixed(0)}}{${f2(qOptimaFab)}}\\right)(${f2(costoPreparacionFab)}) + \\left(\\frac{${f2(qOptimaFab)}}{2}\\right)(${f2(HFab)})(${f2(factorProduccion)}) = ${f2(costoTotalPeriodoFab)}`;

  const corridasPorPeriodo = DFab / qOptimaFab;

  const costoGlobal = costoTotalPeriodoCompra + costoTotalPeriodoFab;
  const externoGana = costoTotalPeriodoCompra < costoTotalPeriodoFab;
  const ahorro = Math.abs(costoTotalPeriodoCompra - costoTotalPeriodoFab);

  return {
    proveedorExterno: {
      Q_optima: qOptimaCompra,
      desglose_D: desgloseDCompra,
      desglose_H: desgloseHCompra,
      desglose_Q: desgloseQCompra,
      desglose_CTA: desgloseCTACompra,
      CTA: costoTotalPeriodoCompra,
      pedidos_por_periodo: pedidosPorPeriodo,
    },
    produccionInterna: {
      Q_optima: qOptimaFab,
      desglose_D: desgloseDFab,
      desglose_H: desgloseHFab,
      desglose_factor: desgloseFactor,
      desglose_Q: desgloseQFab,
      desglose_CTA: desgloseCTAFab,
      CTA: costoTotalPeriodoFab,
      corridas_por_periodo: corridasPorPeriodo,
    },
    totales: {
      costo_global: costoGlobal,
      recomendacion: externoGana ? "comprar" : "fabricar",
      ahorro,
    },
  };
}
