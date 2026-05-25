export interface OpcionDesglose {
  Q_optima: number;
  desglose_D_anual: string;
  desglose_H: string;
  desglose_Q: string;
  desglose_CTA: string;
  CTA: number;
}

export interface ProveedorExternoOutput extends OpcionDesglose {
  pedidos_por_mes: number;
}

export interface ProduccionInternaOutput extends OpcionDesglose {
  desglose_factor: string;
  corridas_por_mes: number;
}

export interface TotalesOutput {
  costo_global: number;
  recomendacion: "comprar" | "fabricar";
  ahorro: number;
}

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
 * Incluye desglose paso a paso en formato LaTeX para renderizado visual.
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

  // --- Proveedor externo (EOQ) ---
  const demandaMensualCompra = demandaTotalMensual * porcentajeCompra;
  const DAnualCompra = demandaMensualCompra * 12;
  const HCompra = tasaMantenimientoAnual * costoUnitarioCompra;

  const desgloseDAnualCompra =
    `D_{\\text{anual, compra}} = (${demandaTotalMensual} \\times ${f2(porcentajeCompra)}) \\times 12 = ${DAnualCompra.toFixed(0)}`;

  const desgloseHCompra =
    `H_{\\text{compra}} = i \\times C_{\\text{compra}} = ${f2(tasaMantenimientoAnual)} \\times ${f2(costoUnitarioCompra)} = ${f2(HCompra)}`;

  const qOptimaCompra = Math.sqrt((2 * DAnualCompra * costoPedidoCompra) / HCompra);

  const desgloseQCompra =
    `Q_{\\text{ext}} = \\sqrt{\\frac{2 \\times ${DAnualCompra.toFixed(0)} \\times ${f2(costoPedidoCompra)}}{${f2(HCompra)}}} = ${f2(qOptimaCompra)}`;

  const costoTotalAnualCompra =
    (DAnualCompra / qOptimaCompra) * costoPedidoCompra + (qOptimaCompra / 2) * HCompra;

  const desgloseCTACompra =
    `CTA_{\\text{ext}} = \\left(\\frac{${DAnualCompra.toFixed(0)}}{${f2(qOptimaCompra)}}\\right)(${f2(costoPedidoCompra)}) + \\left(\\frac{${f2(qOptimaCompra)}}{2}\\right)(${f2(HCompra)}) = ${f2(costoTotalAnualCompra)}`;

  const pedidosPorMes = demandaMensualCompra / qOptimaCompra;

  // --- Produccion interna (EPQ) ---
  const demandaMensualFab = demandaTotalMensual * porcentajeFabricacion;
  const DAnualFab = demandaMensualFab * 12;
  const HFab = tasaMantenimientoAnual * costoUnitarioFab;
  const factorProduccion = 1 - (demandaMensualFab / capacidadProduccionMensual);

  const desgloseDAnualFab =
    `D_{\\text{anual, fab}} = (${demandaTotalMensual} \\times ${f2(porcentajeFabricacion)}) \\times 12 = ${DAnualFab.toFixed(0)}`;

  const desgloseHFab =
    `H_{\\text{fab}} = i \\times C_{\\text{fab}} = ${f2(tasaMantenimientoAnual)} \\times ${f2(costoUnitarioFab)} = ${f2(HFab)}`;

  const desgloseFactor =
    `1 - \\frac{d}{p} = 1 - \\frac{${demandaMensualFab.toFixed(0)}}{${capacidadProduccionMensual.toFixed(0)}} = ${f2(factorProduccion)}`;

  const qOptimaFab = Math.sqrt((2 * DAnualFab * costoPreparacionFab) / (HFab * factorProduccion));

  const desgloseQFab =
    `Q_{\\text{int}} = \\sqrt{\\frac{2 \\times ${DAnualFab.toFixed(0)} \\times ${f2(costoPreparacionFab)}}{${f2(HFab)} \\times ${f2(factorProduccion)}}} = ${f2(qOptimaFab)}`;

  const costoTotalAnualFab =
    (DAnualFab / qOptimaFab) * costoPreparacionFab + (qOptimaFab / 2) * HFab * factorProduccion;

  const desgloseCTAFab =
    `CTA_{\\text{int}} = \\left(\\frac{${DAnualFab.toFixed(0)}}{${f2(qOptimaFab)}}\\right)(${f2(costoPreparacionFab)}) + \\left(\\frac{${f2(qOptimaFab)}}{2}\\right)(${f2(HFab)})(${f2(factorProduccion)}) = ${f2(costoTotalAnualFab)}`;

  const corridasPorMes = demandaMensualFab / qOptimaFab;

  const costoGlobal = costoTotalAnualCompra + costoTotalAnualFab;
  const externoGana = costoTotalAnualCompra < costoTotalAnualFab;
  const ahorro = Math.abs(costoTotalAnualCompra - costoTotalAnualFab);

  return {
    proveedorExterno: {
      Q_optima: qOptimaCompra,
      desglose_D_anual: desgloseDAnualCompra,
      desglose_H: desgloseHCompra,
      desglose_Q: desgloseQCompra,
      desglose_CTA: desgloseCTACompra,
      CTA: costoTotalAnualCompra,
      pedidos_por_mes: pedidosPorMes,
    },
    produccionInterna: {
      Q_optima: qOptimaFab,
      desglose_D_anual: desgloseDAnualFab,
      desglose_H: desgloseHFab,
      desglose_factor: desgloseFactor,
      desglose_Q: desgloseQFab,
      desglose_CTA: desgloseCTAFab,
      CTA: costoTotalAnualFab,
      corridas_por_mes: corridasPorMes,
    },
    totales: {
      costo_global: costoGlobal,
      recomendacion: externoGana ? "comprar" : "fabricar",
      ahorro,
    },
  };
}
