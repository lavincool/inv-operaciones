import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { buildClassifyPrompt, executeModelCalculation, type GeminiExtractedParams } from "@/lib/model-classifier";
import { getModelById } from "@/lib/models-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image || typeof image !== "string") {
      return Response.json({ error: "Se requiere una imagen en base64 en el campo 'image'" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const systemPrompt = buildClassifyPrompt();

    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image" as const,
              image: base64Data,
              mediaType: "image/jpeg",
            },
            {
              type: "text" as const,
              text: "Analiza esta imagen de un problema de investigación de operaciones. Identifica el modelo y extrae los parámetros. Responde ÚNICAMENTE con el JSON.",
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    let parsed: GeminiExtractedParams;
    try {
      const cleaned = text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned) as GeminiExtractedParams;
    } catch {
      return Response.json({
        error: "No se pudo interpretar la respuesta de Gemini",
        rawResponse: text,
      }, { status: 422 });
    }

    if (!parsed.modelId || !parsed.params) {
      return Response.json({
        error: "La respuesta de Gemini no contiene modelId o params",
        parsed,
      }, { status: 422 });
    }

    const model = getModelById(parsed.modelId);
    if (!model) {
      return Response.json({
        error: `Modelo no reconocido: "${parsed.modelId}". Modelos válidos: ${["compra", "produccion", "escasez", "descuentos", "probabilistico", "mm1", "mc1", "mm1n", "mms"].join(", ")}`,
      }, { status: 422 });
    }

    let results: Record<string, number>;
    try {
      results = executeModelCalculation(parsed.modelId, parsed.params);
    } catch (calcError) {
      return Response.json({
        error: `Error al ejecutar el modelo: ${calcError instanceof Error ? calcError.message : String(calcError)}`,
        model: parsed.modelId,
        params: parsed.params,
      }, { status: 422 });
    }

    return Response.json({
      modelId: parsed.modelId,
      modelTitle: model.title,
      family: model.family,
      params: parsed.params,
      results,
      redirectRoute: model.redirectRoute,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("API key") || message.includes("authentication") || message.includes("GOOGLE")) {
      return Response.json({ error: "Error de autenticación con Gemini. Verifica GOOGLE_GENERATIVE_AI_API_KEY en .env.local" }, { status: 500 });
    }
    return Response.json({ error: `Error interno: ${message}` }, { status: 500 });
  }
}
