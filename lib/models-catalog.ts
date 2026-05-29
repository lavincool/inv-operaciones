export type ModelFamily = "inventarios" | "colas";

export interface ParameterDef {
  key: string;
  label: string;
  type: "number";
  description: string;
}

export interface ModelEntry {
  id: string;
  family: ModelFamily;
  title: string;
  description: string;
  keywords: string[];
  parameters: ParameterDef[];
  formulas: string[];
  conditions: string[];
  redirectRoute: string;
}

export const MODELS_CATALOG: ModelEntry[] = [
  // ═══════════════════════════════════════════════════════════════
  //  MODELOS DE INVENTARIOS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "compra",
    family: "inventarios",
    title: "Compra Económica (EOQ Básico)",
    description:
      "Modelo de cantidad económica de pedido para compra externa. Determina el lote óptimo Q que minimiza el costo total de ordenar y mantener inventario. Supone demanda constante, sin descuentos, sin faltantes, reposición instantánea.",
    keywords: [
      "EOQ", "cantidad económica de pedido", "lote económico", "compra",
      "costo de pedido", "costo de ordenar", "costo de mantenimiento",
      "demanda anual", "días laborales", "Q óptima", "CTA", "CTU",
      "reposición instantánea", "sin faltantes", "sin descuentos",
      "cantidad óptima de pedido", "tamaño de lote",
    ],
    parameters: [
      { key: "demandaAnual", label: "D", type: "number", description: "Demanda anual en unidades/año" },
      { key: "costoPedido", label: "S", type: "number", description: "Costo de pedido/ordenar en $ por pedido" },
      { key: "costoMantenimiento", label: "H", type: "number", description: "Costo de mantener una unidad por año en $" },
      { key: "diasLaborales", label: "diasLab", type: "number", description: "Días laborables por año" },
    ],
    formulas: [
      "Q = sqrt(2 * D * S / H)",
      "CTA = (D/Q) * S + (Q/2) * H",
      "CTU = CTA / D",
    ],
    conditions: [
      "D > 0", "S > 0", "H > 0", "días laborales entre 1 y 365",
    ],
    redirectRoute: "/nuevo/inventarios",
  },
  {
    id: "produccion",
    family: "inventarios",
    title: "Producción Interna (EPQ)",
    description:
      "Modelo de lote económico de producción con reposición gradual. La producción ocurre a una tasa finita 'a' mientras simultáneamente se consume el inventario a tasa D. Requiere que la tasa de producción sea mayor que la demanda.",
    keywords: [
      "EPQ", "lote económico de producción", "producción", "fabricación",
      "tasa de producción", "reposición gradual", "costo de preparación",
      "setup", "corridas de producción", "inventario máximo",
      "producción interna", "manufactura",
    ],
    parameters: [
      { key: "demandaAnual", label: "D", type: "number", description: "Demanda anual en unidades/año" },
      { key: "costoPreparacion", label: "S", type: "number", description: "Costo de preparación/setup por corrida en $" },
      { key: "costoMantenimiento", label: "H", type: "number", description: "Costo de mantener una unidad por año en $" },
      { key: "tasaProduccion", label: "a", type: "number", description: "Tasa de producción anual en unidades/año" },
    ],
    formulas: [
      "Q = sqrt(2 * D * S / (H * (1 - D/a)))",
      "Sm = Q * (1 - D/a)",
      "N = D / Q",
      "CTA = (D/Q) * S + (H * Q / 2) * (1 - D/a)",
    ],
    conditions: [
      "D > 0", "S > 0", "H > 0", "a > D (tasa de producción > demanda)",
    ],
    redirectRoute: "/nuevo/inventarios",
  },
  {
    id: "escasez",
    family: "inventarios",
    title: "Con Escasez Permitida",
    description:
      "Modelo EOQ que permite faltantes planificados. Balancea el costo de mantener inventario contra el costo de penalización por escasez. Útil cuando el costo de faltante es menor que el costo de mantener.",
    keywords: [
      "escasez", "faltantes", "faltante permitido", "backorder",
      "costo de escasez", "costo de penalización", "inventario máximo",
      "Sm", "faltante máximo", "ruptura de inventario",
    ],
    parameters: [
      { key: "demandaAnual", label: "D", type: "number", description: "Demanda anual en unidades/año" },
      { key: "costoPedido", label: "S", type: "number", description: "Costo de pedido/ordenar en $ por pedido" },
      { key: "costoMantenimiento", label: "H", type: "number", description: "Costo de mantener una unidad por año en $" },
      { key: "costoEscasez", label: "Ca", type: "number", description: "Costo de escasez/faltante por unidad-año en $" },
    ],
    formulas: [
      "Q = sqrt(2 * D * S * (H + Ca) / (H * Ca))",
      "Sm = sqrt(2 * D * S * Ca / (H * (H + Ca)))",
      "Faltante Máximo = Q - Sm",
      "CTA = (D/Q) * S + H * Sm²/(2Q) + Ca * (Q-Sm)²/(2Q)",
    ],
    conditions: [
      "D > 0", "S > 0", "H > 0", "Ca > 0", "Ca < H para que sea viable",
    ],
    redirectRoute: "/nuevo/inventarios",
  },
  {
    id: "descuentos",
    family: "inventarios",
    title: "Descuentos por Cantidad",
    description:
      "Evalúa si conviene aceptar un descuento por comprar una cantidad mínima. Compara el costo total sin descuento (pidiendo el EOQ base) contra el costo total con descuento (pidiendo la cantidad mínima requerida).",
    keywords: [
      "descuento", "descuentos por cantidad", "descuento por volumen",
      "precio normal", "precio con descuento", "cantidad mínima",
      "umbral de descuento", "proveedor", "C1", "C2", "Qmin",
    ],
    parameters: [
      { key: "demandaAnual", label: "D", type: "number", description: "Demanda anual en unidades/año" },
      { key: "costoPedido", label: "S", type: "number", description: "Costo de pedido/ordenar en $ por pedido" },
      { key: "costoMantenimiento", label: "H", type: "number", description: "Costo de mantener una unidad por año en $" },
      { key: "precioNivel1", label: "C1", type: "number", description: "Precio unitario sin descuento en $" },
      { key: "precioNivel2", label: "C2", type: "number", description: "Precio unitario con descuento en $" },
      { key: "cantidadMinima", label: "Qmin", type: "number", description: "Cantidad mínima para obtener el descuento" },
    ],
    formulas: [
      "Q_base = sqrt(2 * D * S / H)",
      "CT_sin = (D/Q_base) * S + H * Q_base/2 + C1 * D",
      "CT_con = (D/Qmin) * S + H * Qmin/2 + C2 * D",
      "Decisión = CT_con < CT_sin ? con_descuento : sin_descuento",
    ],
    conditions: [
      "D > 0", "S > 0", "H > 0", "C1 > 0", "C2 > 0", "Qmin > 0", "C2 < C1",
    ],
    redirectRoute: "/nuevo/inventarios",
  },
  {
    id: "probabilistico",
    family: "inventarios",
    title: "Probabilístico (Stock de Seguridad)",
    description:
      "Modelo de inventario con demanda variable (aleatoria). Calcula el lote económico, el punto de reorden y el stock de seguridad usando el valor Z (nivel de servicio deseado). Útil cuando la demanda no es constante y se quiere proteger contra variabilidad.",
    keywords: [
      "probabilístico", "stock de seguridad", "punto de reorden", "PR",
      "demanda variable", "demanda aleatoria", "valor Z", "nivel de servicio",
      "varianza", "desviación estándar", "lead time", "tiempo de entrega",
      "SS", "inventario de seguridad", "Z",
    ],
    parameters: [
      { key: "demandaPromedio", label: "μ", type: "number", description: "Demanda promedio anual en unidades" },
      { key: "varianza", label: "σ²", type: "number", description: "Varianza de la demanda (σ² ≥ 0)" },
      { key: "valorZ", label: "Z", type: "number", description: "Valor Z del nivel de servicio (1.65 para 95%)" },
      { key: "costoPedido", label: "S", type: "number", description: "Costo de pedido/ordenar en $" },
      { key: "costoMantenimiento", label: "H", type: "number", description: "Costo de mantener una unidad por año en $" },
      { key: "tiempoEntrega", label: "L", type: "number", description: "Tiempo de entrega/lead time en días" },
    ],
    formulas: [
      "Q = sqrt(2 * D * S / H)",
      "d = D / 365",
      "Demanda_LT = d * L",
      "σ_LT = sqrt(σ² * L / 365)",
      "SS = Z * σ_LT",
      "PR = Demanda_LT + SS",
    ],
    conditions: [
      "μ > 0", "σ² ≥ 0", "S > 0", "H > 0", "L > 0",
    ],
    redirectRoute: "/nuevo/inventarios",
  },
  // ═══════════════════════════════════════════════════════════════
  //  MODELOS DE COLAS / LÍNEAS DE ESPERA
  // ═══════════════════════════════════════════════════════════════
  {
    id: "mm1",
    family: "colas",
    title: "M/M/1 — Cola Simple",
    description:
      "Modelo de línea de espera con un solo servidor. Las llegadas siguen distribución Poisson (tasa λ) y el servicio es exponencial (tasa μ). Capacidad infinita, disciplina FIFO. Requiere λ < μ para estabilidad.",
    keywords: [
      "M/M/1", "cola simple", "un servidor", "línea de espera",
      "tasa de llegada", "tasa de servicio", "lambda", "mu",
      "utilización", "rho", "L", "Lq", "W", "Wq", "P0",
      "factor de utilización", "clientes en fila", "clientes en sistema",
      "tiempo de espera", "Poisson", "exponencial",
    ],
    parameters: [
      { key: "lambda", label: "λ", type: "number", description: "Tasa de llegada (clientes/unidad de tiempo)" },
      { key: "mu", label: "μ", type: "number", description: "Tasa de servicio (clientes/unidad de tiempo)" },
    ],
    formulas: [
      "ρ = λ / μ",
      "P₀ = 1 - ρ",
      "L = λ / (μ - λ)",
      "Lq = ρ * L",
      "W = 1 / (μ - λ)",
      "Wq = ρ * W",
    ],
    conditions: [
      "λ > 0", "μ > 0", "λ < μ (estabilidad)",
    ],
    redirectRoute: "/nuevo/colas",
  },
  {
    id: "mc1",
    family: "colas",
    title: "M/C/1 — Servicio Constante",
    description:
      "Modelo de cola con un servidor y tiempo de servicio determinístico (constante). Las llegadas son Poisson. Se usa cuando el servicio es automatizado o mecánico (sin variabilidad).",
    keywords: [
      "M/C/1", "servicio constante", "servicio determinístico",
      "tiempo fijo", "servicio mecánico", "automatizado",
      "tiempo de servicio constante", "sin variabilidad en servicio",
    ],
    parameters: [
      { key: "lambda", label: "λ", type: "number", description: "Tasa de llegada (clientes/unidad de tiempo)" },
      { key: "mu", label: "μ", type: "number", description: "Tasa de servicio (clientes/unidad de tiempo) — constante" },
    ],
    formulas: [
      "ρ = λ / μ",
      "P₀ = 1 - ρ",
      "Lq = λ² / (2 * μ * (μ - λ))",
      "L = Lq + ρ",
      "Wq = Lq / λ",
      "W = Wq + 1/μ",
    ],
    conditions: [
      "λ > 0", "μ > 0", "λ < μ (estabilidad)",
    ],
    redirectRoute: "/nuevo/colas",
  },
  {
    id: "mm1n",
    family: "colas",
    title: "M/M/1/N — Capacidad Limitada",
    description:
      "Modelo de cola con un servidor y capacidad máxima N en el sistema. Cuando el sistema está lleno, los nuevos clientes son rechazados. Útil cuando hay un límite físico de espacio.",
    keywords: [
      "M/M/1/N", "capacidad limitada", "capacidad máxima",
      "clientes rechazados", "espacio limitado", "buffer finito",
      "sistema lleno", "N máximo", "cola finita",
    ],
    parameters: [
      { key: "lambda", label: "λ", type: "number", description: "Tasa de llegada (clientes/unidad de tiempo)" },
      { key: "mu", label: "μ", type: "number", description: "Tasa de servicio (clientes/unidad de tiempo)" },
      { key: "capacidad", label: "N", type: "number", description: "Capacidad máxima del sistema (entero ≥ 1)" },
    ],
    formulas: [
      "P₀ = 1 / Σ(i=0..N) [N!/(N-i)! * (λ/μ)^i]",
      "ρ = 1 - P₀",
      "L = N - (μ/λ) * (1 - P₀)",
      "Lq = N - ((λ+μ)/λ) * (1 - P₀)",
      "W = L / ((N-L) * λ)",
      "Wq = Lq / ((N-L) * λ)",
    ],
    conditions: [
      "λ > 0", "μ > 0", "N ≥ 1 (entero)",
    ],
    redirectRoute: "/nuevo/colas",
  },
  {
    id: "mms",
    family: "colas",
    title: "M/M/S — Múltiples Servidores",
    description:
      "Modelo de cola con S servidores idénticos en paralelo y una sola fila. Las llegadas son Poisson y el servicio exponencial. Requiere λ < S·μ para estabilidad del sistema.",
    keywords: [
      "M/M/S", "múltiples servidores", "varios servidores",
      "servidores en paralelo", "cola única", "fila única",
      "S servidores", "varias cajas", "múltiples canales",
    ],
    parameters: [
      { key: "lambda", label: "λ", type: "number", description: "Tasa de llegada (clientes/unidad de tiempo)" },
      { key: "mu", label: "μ", type: "number", description: "Tasa de servicio por servidor (clientes/unidad de tiempo)" },
      { key: "servidores", label: "S", type: "number", description: "Número de servidores (entero ≥ 1)" },
    ],
    formulas: [
      "ρ = λ / (S * μ)",
      "P₀ = 1 / [Σ(i=0..S-1)(λ/μ)^i/i! + (λ/μ)^S/(S!(1-ρ))]",
      "Lq = P₀ * (λ/μ)^S * ρ / (S! * (1-ρ)²)",
      "Wq = Lq / λ",
      "W = Wq + 1/μ",
      "L = λ * W",
    ],
    conditions: [
      "λ > 0", "μ > 0", "S ≥ 1 (entero)", "λ < S * μ (estabilidad)",
    ],
    redirectRoute: "/nuevo/colas",
  },
];

export function getModelById(id: string): ModelEntry | undefined {
  return MODELS_CATALOG.find((m) => m.id === id);
}

export function getModelsByFamily(family: ModelFamily): ModelEntry[] {
  return MODELS_CATALOG.filter((m) => m.family === family);
}
