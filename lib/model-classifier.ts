import { MODELS_CATALOG, type ModelEntry } from "@/lib/models-catalog";
import { calculateCompra, calculateProduccion, calculateEscasez, calculateDescuentos, calculateProbabilistico } from "@/lib/inv-operaciones";
import { calculateMM1, calculateMC1, calculateMM1N, calculateMMS } from "@/lib/colas-operaciones";

/* ── Tipos de respuesta de Gemini ─────────────────────────────────────── */

export interface GeminiExtractedParams {
  modelId: string;
  params: Record<string, number>;
}

export interface ClassifyResult {
  model: ModelEntry;
  params: Record<string, number>;
  results: Record<string, number>;
  redirectRoute: string;
}

/* ── Prompt builder ───────────────────────────────────────────────────── */

export function buildClassifyPrompt(): string {
  const modelsText = MODELS_CATALOG.map((m) => {
    const paramsText = m.parameters
      .map((p) => `      - "${p.key}": ${p.label} — ${p.description}`)
      .join("\n");
    const kwText = m.keywords.slice(0, 10).join(", ");
    return `### ${m.id} — ${m.title}
    Familia: ${m.family === "inventarios" ? "Inventarios (EOQ/EPQ)" : "Teoría de Colas (Líneas de Espera)"}
    Descripción: ${m.description}
    Palabras clave: ${kwText}
    Parámetros:
${paramsText}
    Condiciones: ${m.conditions.join("; ")}
`;
  }).join("\n");

  return `Eres un experto en Investigación de Operaciones (Operations Research). 
Analiza la imagen de un problema académico de inventarios o líneas de espera.

Debes:
1. Identificar cuál de los siguientes modelos describe el problema.
2. Extraer TODOS los valores numéricos de los parámetros relevantes del texto en la imagen.

## CATÁLOGO DE MODELOS

${modelsText}

## FORMATO DE RESPUESTA OBLIGATORIO

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin explicaciones. El JSON debe tener esta estructura exacta:

{
  "modelId": "<id del modelo: compra|produccion|escasez|descuentos|probabilistico|mm1|mc1|mm1n|mms>",
  "params": {
    "<key1>": <valor numérico>,
    "<key2>": <valor numérico>
  }
}

## REGLAS IMPORTANTES

- Solo incluye en "params" los parámetros que aparecen EXPLÍCITAMENTE en el texto/foto.
- Cada valor debe ser un número (no string).
- Si un parámetro no aparece en el texto, NO lo incluyas en "params".
- Si ves "días" junto a demanda, probablemente es "diasLaborales".
- Si ves porcentaje (ej. 25%), conviértelo a decimal (0.25) si es tasa, o al número directo si pide %.
- Para modelos de colas: λ = tasa de llegada, μ = tasa de servicio. Si el texto dice "clientes por hora" → es λ o μ. Si dice "minutos por cliente" → conviértelo (1/valor).
- Si hay "costo de pedido", "costo de ordenar", "costo de preparación" → es S.
- Si hay "costo de mantener", "costo de almacenamiento" → es H.
- Si hay "precio unitario", "costo unitario" y NO hay H explícito → puede ser C para calcular H = C * i.
- "Qmin", "cantidad mínima", "umbral" → cantidadMinima.
- "tasa de producción", "capacidad de producción" → tasaProduccion.
- "costo de faltante", "costo de escasez", "costo de penalización" → costoEscasez.
- "Z", "nivel de servicio", "factor de seguridad" → valorZ.
- "lead time", "tiempo de entrega", "L" en días → tiempoEntrega.
- "varianza", "σ²" → varianza.
- "servidores", "cajeros", "canales", "S" → servidores.
- "capacidad máxima", "N", "límite del sistema" → capacidad.
`;
}

/* ── Router de cálculo ────────────────────────────────────────────────── */

export function executeModelCalculation(
  modelId: string,
  params: Record<string, number>,
): Record<string, number> {
  switch (modelId) {
    case "compra": {
      const result = calculateCompra({
        demandaAnual: params.demandaAnual ?? 0,
        costoPedido: params.costoPedido ?? 0,
        costoMantenimiento: params.costoMantenimiento ?? 0,
        diasLaborales: params.diasLaborales ?? 250,
      });
      return { q: result.q, cta: result.cta, ctu: result.ctu, demandaDiaria: result.demandaDiaria };
    }
    case "produccion": {
      const result = calculateProduccion({
        demandaAnual: params.demandaAnual ?? 0,
        costoPreparacion: params.costoPreparacion ?? 0,
        costoMantenimiento: params.costoMantenimiento ?? 0,
        tasaProduccion: params.tasaProduccion ?? 0,
      });
      return { q: result.q, sm: result.sm, cta: result.cta, n: result.n };
    }
    case "escasez": {
      const result = calculateEscasez({
        demandaAnual: params.demandaAnual ?? 0,
        costoPedido: params.costoPedido ?? 0,
        costoMantenimiento: params.costoMantenimiento ?? 0,
        costoEscasez: params.costoEscasez ?? 0,
      });
      return { q: result.q, sm: result.sm, cta: result.cta, faltante: result.faltante };
    }
    case "descuentos": {
      const result = calculateDescuentos({
        demandaAnual: params.demandaAnual ?? 0,
        costoPedido: params.costoPedido ?? 0,
        costoMantenimiento: params.costoMantenimiento ?? 0,
        precioNivel1: params.precioNivel1 ?? 0,
        precioNivel2: params.precioNivel2 ?? 0,
        cantidadMinima: params.cantidadMinima ?? 0,
      });
      return { qBase: result.qBase, ctSin: result.ctSin, ctCon: result.ctCon, ahorro: result.ahorro, decision: result.decision === "con_descuento" ? 1 : 0 };
    }
    case "probabilistico": {
      const result = calculateProbabilistico({
        demandaPromedio: params.demandaPromedio ?? 0,
        varianza: params.varianza ?? 0,
        valorZ: params.valorZ ?? 1.65,
        costoPedido: params.costoPedido ?? 0,
        costoMantenimiento: params.costoMantenimiento ?? 0,
        tiempoEntrega: params.tiempoEntrega ?? 0,
      });
      return { q: result.q, pr: result.pr, stockSeguridad: result.stockSeguridad, demandaDiaria: result.demandaDiaria, demandaLeadTime: result.demandaLeadTime };
    }
    case "mm1": {
      const result = calculateMM1({
        lambda: params.lambda ?? 0,
        mu: params.mu ?? 0,
        n: 2,
        cs: 100,
        ce: 50,
        unitConfig: { lambdaUnit: "hora", muUnit: "hora", lambdaType: "cliente_tiempo", muType: "cliente_tiempo" },
      });
      return { P: result.P, P0: result.P0, L: result.L, Lq: result.Lq, W: result.W, Wq: result.Wq, CT: result.CT };
    }
    case "mc1": {
      const result = calculateMC1({
        lambda: params.lambda ?? 0,
        mu: params.mu ?? 0,
        cs: 100,
        ce: 50,
        unitConfig: { lambdaUnit: "hora", muUnit: "hora", lambdaType: "cliente_tiempo", muType: "cliente_tiempo" },
      });
      return { P: result.P, P0: result.P0, L: result.L, Lq: result.Lq, W: result.W, Wq: result.Wq, CT: result.CT };
    }
    case "mm1n": {
      const result = calculateMM1N({
        lambda: params.lambda ?? 0,
        mu: params.mu ?? 0,
        capacidad: params.capacidad ?? 0,
        cs: 100,
        ce: 50,
        unitConfig: { lambdaUnit: "hora", muUnit: "hora", lambdaType: "cliente_tiempo", muType: "cliente_tiempo" },
      });
      return { P: result.P, P0: result.P0, L: result.L, Lq: result.Lq, W: result.W, Wq: result.Wq, CT: result.CT, capacidadUtilizada: result.capacidadUtilizada };
    }
    case "mms": {
      const result = calculateMMS({
        lambda: params.lambda ?? 0,
        mu: params.mu ?? 0,
        servidores: params.servidores ?? 0,
        n: 3,
        cs: 100,
        ce: 50,
        unitConfig: { lambdaUnit: "hora", muUnit: "hora", lambdaType: "cliente_tiempo", muType: "cliente_tiempo" },
      });
      return { P: result.P, P0: result.P0, L: result.L, Lq: result.Lq, W: result.W, Wq: result.Wq, CT: result.CT, servidoresActivos: result.servidoresActivos };
    }
    default:
      throw new Error(`Modelo no reconocido: ${modelId}`);
  }
}
