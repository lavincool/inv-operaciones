// ══════════════════════════════════════════════════════════════════════════════
//  MODELOS DE INVENTARIO — 5 modelos con formulas del sistema original
//  Basado en example_code/2/formulario.py y sus modelos correspondientes
// ══════════════════════════════════════════════════════════════════════════════

/* ── Utilidades ─────────────────────────────────────────────────────────── */

function fmt(value: number, decimals = 4): string {
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 1 — Compra Economica (EOQ Basico)
 * ════════════════════════════════════════════════════════════════════════════ */

export interface CompraInput {
  demandaAnual: number;
  costoPedido: number;
  costoMantenimiento: number;
  diasLaborales: number;
}

export interface CompraDesgloses {
  Q: string;
  CTA: string;
  CTU: string;
}

export interface CompraOutput {
  q: number;
  cta: number;
  ctu: number;
  demandaDiaria: number;
  desgloses: CompraDesgloses;
}

export function calculateCompra(input: CompraInput): CompraOutput {
  const { demandaAnual, costoPedido, costoMantenimiento, diasLaborales } = input;

  if (demandaAnual <= 0) throw new Error("La demanda anual debe ser mayor a cero.");
  if (costoPedido <= 0) throw new Error("El costo por pedido debe ser mayor a cero.");
  if (costoMantenimiento <= 0) throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  if (diasLaborales < 1 || diasLaborales > 365) throw new Error("Los dias laborales deben estar entre 1 y 365.");

  const D = demandaAnual;
  const S = costoPedido;
  const H = costoMantenimiento;

  const Q = Math.sqrt((2 * D * S) / H);
  const d = D / diasLaborales;
  const CTA = (D / Q) * S + (Q / 2) * H;
  const CTU = CTA / D;

  const desgloses: CompraDesgloses = {
    Q: `Q = \\sqrt{\\frac{2 \\times D \\times S}{H}} = \\sqrt{\\frac{2 \\times ${D} \\times ${fmt(S)}}{${fmt(H)}}} = ${fmt(Q)}`,
    CTA: `CTA = \\left(\\frac{D}{Q}\\right) \\times S + \\left(\\frac{Q}{2}\\right) \\times H = \\left(\\frac{${D}}{${fmt(Q)}}\\right)(${fmt(S)}) + \\left(\\frac{${fmt(Q)}}{2}\\right)(${fmt(H)}) = \\$${fmt(CTA)}`,
    CTU: `CTU = \\frac{CTA}{D} = \\frac{${fmt(CTA)}}{${D}} = \\$${fmt(CTU)}`,
  };

  return { q: Q, cta: CTA, ctu: CTU, demandaDiaria: d, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 2 — Produccion Interna (EPQ)
 * ════════════════════════════════════════════════════════════════════════════ */

export interface ProduccionInput {
  demandaAnual: number;
  costoPreparacion: number;
  costoMantenimiento: number;
  tasaProduccion: number;
}

export interface ProduccionDesgloses {
  Q: string;
  Sm: string;
  CTA: string;
  N: string;
}

export interface ProduccionOutput {
  q: number;
  sm: number;
  cta: number;
  n: number;
  desgloses: ProduccionDesgloses;
}

export function calculateProduccion(input: ProduccionInput): ProduccionOutput {
  const { demandaAnual, costoPreparacion, costoMantenimiento, tasaProduccion } = input;

  if (demandaAnual <= 0) throw new Error("La demanda anual debe ser mayor a cero.");
  if (costoPreparacion <= 0) throw new Error("El costo de preparacion debe ser mayor a cero.");
  if (costoMantenimiento <= 0) throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  if (tasaProduccion <= demandaAnual) throw new Error("La tasa de produccion (a) debe ser mayor que la demanda (D).");

  const D = demandaAnual;
  const S = costoPreparacion;
  const H = costoMantenimiento;
  const a = tasaProduccion;

  const Q = Math.sqrt((2 * D * S) / (H * (1 - D / a)));
  const Sm = Q * (1 - D / a);
  const N = D / Q;
  const CTA = (D / Q) * S + (H * Q / 2) * (1 - D / a);

  const factorProduccion = 1 - D / a;

  const desgloses: ProduccionDesgloses = {
    Q: `Q = \\sqrt{\\frac{2 \\times D \\times S}{H \\times (1 - D/a)}} = \\sqrt{\\frac{2 \\times ${D} \\times ${fmt(S)}}{${fmt(H)} \\times (1 - ${D}/${a})}} = ${fmt(Q)}`,
    Sm: `S_m = Q \\times \\left(1 - \\frac{D}{a}\\right) = ${fmt(Q)} \\times ${fmt(factorProduccion)} = ${fmt(Sm)}`,
    CTA: `CTA = \\left(\\frac{D}{Q}\\right) \\times S + \\frac{H \\times Q}{2} \\times \\left(1 - \\frac{D}{a}\\right) = \\$${fmt(CTA)}`,
    N: `N = \\frac{D}{Q} = \\frac{${D}}{${fmt(Q)}} = ${fmt(N)} \\ \\text{corridas/año}`,
  };

  return { q: Q, sm: Sm, cta: CTA, n: N, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 3 — Con Escasez Permitida
 * ════════════════════════════════════════════════════════════════════════════ */

export interface EscasezInput {
  demandaAnual: number;
  costoPedido: number;
  costoMantenimiento: number;
  costoEscasez: number;
}

export interface EscasezDesgloses {
  Q: string;
  Sm: string;
  CTA: string;
}

export interface EscasezOutput {
  q: number;
  sm: number;
  cta: number;
  faltante: number;
  desgloses: EscasezDesgloses;
}

export function calculateEscasez(input: EscasezInput): EscasezOutput {
  const { demandaAnual, costoPedido, costoMantenimiento, costoEscasez } = input;

  if (demandaAnual <= 0) throw new Error("La demanda anual debe ser mayor a cero.");
  if (costoPedido <= 0) throw new Error("El costo por pedido debe ser mayor a cero.");
  if (costoMantenimiento <= 0) throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  if (costoEscasez <= 0) throw new Error("El costo de escasez debe ser mayor a cero.");

  const D = demandaAnual;
  const S = costoPedido;
  const H = costoMantenimiento;
  const Ca = costoEscasez;

  const Q = Math.sqrt((2 * D * S * (H + Ca)) / (H * Ca));
  const Sm = Math.sqrt((2 * D * S * Ca) / (H * (H + Ca)));
  const faltante = Q - Sm;
  const CTA = (D / Q) * S + H * (Sm * Sm / (2 * Q)) + Ca * ((Q - Sm) * (Q - Sm) / (2 * Q));

  const desgloses: EscasezDesgloses = {
    Q: `Q = \\sqrt{\\frac{2 \\times D \\times S \\times (H + Ca)}{H \\times Ca}} = \\sqrt{\\frac{2 \\times ${D} \\times ${fmt(S)} \\times (${fmt(H)} + ${fmt(Ca)})}{${fmt(H)} \\times ${fmt(Ca)}}} = ${fmt(Q)}`,
    Sm: `S_m = \\sqrt{\\frac{2 \\times D \\times S \\times Ca}{H \\times (H + Ca)}} = \\sqrt{\\frac{2 \\times ${D} \\times ${fmt(S)} \\times ${fmt(Ca)}}{${fmt(H)} \\times (${fmt(H)} + ${fmt(Ca)})}} = ${fmt(Sm)}`,
    CTA: `CTA = \\frac{D}{Q} \\times S + H \\times \\frac{S_m^2}{2Q} + Ca \\times \\frac{(Q - S_m)^2}{2Q} = \\$${fmt(CTA)}`,
  };

  return { q: Q, sm: Sm, cta: CTA, faltante, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 4 — Con Descuentos por Cantidad
 * ════════════════════════════════════════════════════════════════════════════ */

export interface DescuentosInput {
  demandaAnual: number;
  costoPedido: number;
  costoMantenimiento: number;
  precioNivel1: number;
  precioNivel2: number;
  cantidadMinima: number;
}

export interface DescuentosDesgloses {
  Q: string;
  CTSin: string;
  CTCon: string;
}

export type DescuentosDecision = "con_descuento" | "sin_descuento";

export interface DescuentosOutput {
  qBase: number;
  ctSin: number;
  ctCon: number;
  decision: DescuentosDecision;
  ahorro: number;
  desgloses: DescuentosDesgloses;
}

export function calculateDescuentos(input: DescuentosInput): DescuentosOutput {
  const { demandaAnual, costoPedido, costoMantenimiento, precioNivel1, precioNivel2, cantidadMinima } = input;

  if (demandaAnual <= 0) throw new Error("La demanda anual debe ser mayor a cero.");
  if (costoPedido <= 0) throw new Error("El costo por pedido debe ser mayor a cero.");
  if (costoMantenimiento <= 0) throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  if (precioNivel1 <= 0) throw new Error("El precio nivel 1 debe ser mayor a cero.");
  if (precioNivel2 <= 0) throw new Error("El precio nivel 2 debe ser mayor a cero.");
  if (cantidadMinima <= 0) throw new Error("La cantidad minima debe ser mayor a cero.");

  const D = demandaAnual;
  const S = costoPedido;
  const H = costoMantenimiento;
  const C1 = precioNivel1;
  const C2 = precioNivel2;
  const qMin = cantidadMinima;

  const Qbase = Math.sqrt((2 * D * S) / H);
  const CTSin = (D / Qbase) * S + H * (Qbase / 2) + C1 * D;
  const CTCon = (D / qMin) * S + H * (qMin / 2) + C2 * D;
  const decision: DescuentosDecision = CTCon < CTSin ? "con_descuento" : "sin_descuento";
  const ahorro = Math.abs(CTSin - CTCon);

  const desgloses: DescuentosDesgloses = {
    Q: `Q_{\\text{base}} = \\sqrt{\\frac{2 \\times D \\times S}{H}} = \\sqrt{\\frac{2 \\times ${D} \\times ${fmt(S)}}{${fmt(H)}}} = ${fmt(Qbase)}`,
    CTSin: `CT_{\\text{sin}} = \\frac{D}{Q} \\times S + H \\times \\frac{Q}{2} + C_1 \\times D = \\frac{${D}}{${fmt(Qbase)}}(${fmt(S)}) + ${fmt(H)} \\times \\frac{${fmt(Qbase)}}{2} + ${C1} \\times ${D} = \\$${fmt(CTSin)}`,
    CTCon: `CT_{\\text{con}} = \\frac{D}{Q_{\\text{min}}} \\times S + H \\times \\frac{Q_{\\text{min}}}{2} + C_2 \\times D = \\frac{${D}}{${qMin}}(${fmt(S)}) + ${fmt(H)} \\times \\frac{${qMin}}{2} + ${C2} \\times ${D} = \\$${fmt(CTCon)}`,
  };

  return { qBase: Qbase, ctSin: CTSin, ctCon: CTCon, decision, ahorro, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 5 — Probabilistico (Stock de Seguridad + Punto de Reorden)
 * ════════════════════════════════════════════════════════════════════════════ */

export interface ProbabilisticoInput {
  demandaPromedio: number;
  varianza: number;
  valorZ: number;
  costoPedido: number;
  costoMantenimiento: number;
  tiempoEntrega: number;
}

export interface ProbabilisticoDesgloses {
  Q: string;
  PR: string;
  SS: string;
}

export interface ProbabilisticoOutput {
  q: number;
  pr: number;
  stockSeguridad: number;
  demandaDiaria: number;
  demandaLeadTime: number;
  desviacion: number;
  desgloses: ProbabilisticoDesgloses;
}

export function calculateProbabilistico(input: ProbabilisticoInput): ProbabilisticoOutput {
  const { demandaPromedio, varianza, valorZ, costoPedido, costoMantenimiento, tiempoEntrega } = input;

  if (demandaPromedio <= 0) throw new Error("La demanda promedio debe ser mayor a cero.");
  if (varianza < 0) throw new Error("La varianza no puede ser negativa.");
  if (costoPedido <= 0) throw new Error("El costo por pedido debe ser mayor a cero.");
  if (costoMantenimiento <= 0) throw new Error("El costo de mantenimiento debe ser mayor a cero.");
  if (tiempoEntrega <= 0) throw new Error("El tiempo de entrega debe ser mayor a cero.");

  const D = demandaPromedio;
  const S = costoPedido;
  const H = costoMantenimiento;
  const L = tiempoEntrega;

  const Q = Math.sqrt((2 * D * S) / H);
  const demandaDiaria = D / 365;
  const demandaLeadTime = demandaDiaria * L;
  const desviacion = Math.sqrt(varianza * L / 365);
  const SS = valorZ * desviacion;
  const PR = demandaLeadTime + SS;

  const desgloses: ProbabilisticoDesgloses = {
    Q: `Q = \\sqrt{\\frac{2 \\times D \\times S}{H}} = \\sqrt{\\frac{2 \\times ${D} \\times ${fmt(S)}}{${fmt(H)}}} = ${fmt(Q)}`,
    PR: `\\text{Demanda diaria} = \\frac{D}{365} = \\frac{${D}}{365} = ${fmt(demandaDiaria)}\\\\` +
        `\\text{Demanda en Lead Time} = d \\times L = ${fmt(demandaDiaria)} \\times ${L} = ${fmt(demandaLeadTime)}\\\\` +
        `\\sigma_{\\text{LT}} = \\sqrt{\\frac{\\sigma^2 \\times L}{365}} = \\sqrt{\\frac{${varianza} \\times ${L}}{365}} = ${fmt(desviacion)}\\\\` +
        `PR = \\text{Demanda LT} + Z \\times \\sigma_{\\text{LT}} = ${fmt(demandaLeadTime)} + ${valorZ} \\times ${fmt(desviacion)} = ${fmt(PR)}`,
    SS: `SS = Z \\times \\sigma_{\\text{LT}} = ${valorZ} \\times ${fmt(desviacion)} = ${fmt(SS)}`,
  };

  return { q: Q, pr: PR, stockSeguridad: SS, demandaDiaria, demandaLeadTime, desviacion, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  UTILIDAD: Calcular H a partir de C e I
 * ════════════════════════════════════════════════════════════════════════════ */

export function calcularCostoMantenimiento(costoUnitario: number, tasaMantenimiento: number): number {
  return costoUnitario * (tasaMantenimiento / 100);
}
