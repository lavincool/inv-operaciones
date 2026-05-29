"use client";

import { useState, useRef, useCallback } from "react";
import {
  Button,
  Card,
  Chip,
  Typography,
  Spinner,
} from "@heroui/react";
import {
  Camera,
  Upload,
  ArrowLeft,
  ArrowRight,
  ScanLine,
  CheckCircle,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ApiResponse {
  modelId: string;
  modelTitle: string;
  family: "inventarios" | "colas";
  params: Record<string, number>;
  results: Record<string, number>;
  redirectRoute: string;
}

function fmtDecimal(value: number, decimals = 4): string {
  return value.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(value);
}

const RESULT_LABELS: Record<string, string> = {
  q: "Q (Lote Óptimo)",
  cta: "CTA (Costo Total Anual)",
  ctu: "CTU (Costo Total Unitario)",
  demandaDiaria: "Demanda Diaria",
  sm: "Sm (Inventario Máximo)",
  n: "N (Corridas/Año)",
  faltante: "Faltante Máximo",
  ctSin: "CT Sin Descuento",
  ctCon: "CT Con Descuento",
  ahorro: "Ahorro",
  decision: "Decisión (1=Descuento)",
  qBase: "Q Base",
  pr: "PR (Punto de Reorden)",
  stockSeguridad: "Stock Seguridad",
  demandaLeadTime: "Demanda en Lead Time",
  P: "ρ (Utilización)",
  P0: "P₀ (Sistema Vacío)",
  L: "L (Clientes en Sistema)",
  Lq: "Lq (Clientes en Fila)",
  W: "W (Tiempo en Sistema)",
  Wq: "Wq (Tiempo en Fila)",
  CT: "CT (Costo Total)",
  capacidadUtilizada: "Capacidad Utilizada (%)",
  servidoresActivos: "Servidores Activos",
};

export default function ScannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCameraCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Error desconocido del servidor");
        return;
      }
      setResult(data as ApiResponse);
    } catch {
      setError("Error de conexión con el servidor. Verifica que el servidor esté corriendo.");
    } finally {
      setLoading(false);
    }
  }, [image]);

  const handleClear = useCallback(() => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleRedirectToForm = useCallback(() => {
    if (!result) return;
    const params = new URLSearchParams();
    params.set("modelo", result.modelId);
    for (const [key, value] of Object.entries(result.params)) {
      params.set(key, String(value));
    }
    router.push(`${result.redirectRoute}?${params.toString()}`);
  }, [result, router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground" href="/nuevo">
          <ArrowLeft className="size-3.5" /><span>Sistema de Modelos</span>
        </Link>
        <Typography type="h1">Escáner de Problemas</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Toma una foto de un problema de investigación de operaciones y el sistema identificará el modelo y extraerá los parámetros automáticamente.
        </Typography>
      </div>

      {/* Upload Area */}
      <Card className="mb-8">
        <Card.Content className="py-8">
          {!image ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-20 items-center justify-center rounded-full bg-accent/10">
                <ScanLine className="size-10 text-accent" />
              </div>
              <div className="text-center">
                <Typography type="h3" className="mb-1">Sube una foto del problema</Typography>
                <Typography color="muted" type="body-sm">
                  Formatos: JPG, PNG. Máximo 10MB.
                </Typography>
              </div>
              <div className="flex gap-3">
                <Button variant="primary" size="lg" onPress={handleCameraCapture}>
                  <Camera className="size-4" />Tomar Foto
                </Button>
                <Button variant="tertiary" size="lg" onPress={handleCameraCapture}>
                  <Upload className="size-4" />Subir Archivo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                capture="environment"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-md overflow-hidden rounded-lg border border-default-200">
                <img
                  src={image}
                  alt="Problema capturado"
                  className="w-full object-contain"
                  style={{ maxHeight: 300 }}
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 bg-background/80 backdrop-blur"
                  onPress={handleClear}
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="primary" size="lg" isDisabled={loading} onPress={handleAnalyze}>
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-1" />Analizando...
                    </>
                  ) : (
                    <>
                      <ScanLine className="size-4" />Analizar Problema
                    </>
                  )}
                </Button>
                <Button variant="tertiary" size="lg" isDisabled={loading} onPress={handleClear}>
                  <Trash2 className="size-4" />Descartar
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Error */}
      {error && (
        <Card className="mb-8 border border-danger/30 bg-danger/5">
          <Card.Content className="py-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-danger mt-0.5" />
              <div>
                <Typography className="font-semibold text-danger" type="body">Error al analizar la imagen</Typography>
                <Typography className="mt-1 text-sm" color="muted" type="body-sm">{error}</Typography>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Model Identification */}
          <Card className="mb-6 ring-2 ring-success/30">
            <Card.Content className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle className="size-5 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Typography type="body" className="font-semibold">{result.modelTitle}</Typography>
                    <Chip color={result.family === "inventarios" ? "warning" : "success"} size="sm" variant="soft">
                      {result.family === "inventarios" ? "Inventarios" : "Colas"}
                    </Chip>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Extracted Parameters */}
          <Card className="mb-6">
            <Card.Header>
              <Card.Title>Parámetros Extraídos</Card.Title>
              <Card.Description>Valores detectados por Gemini desde la imagen</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(result.params).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-default-200 bg-default-50 px-3 py-2">
                    <Typography className="text-xs" color="muted" type="body-sm">{key}</Typography>
                    <Typography className="text-sm font-semibold tabular-nums" type="body">{fmtDecimal(value, 4)}</Typography>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Calculated Results */}
          <Card className="mb-6">
            <Card.Header>
              <Card.Title>Resultados Calculados</Card.Title>
              <Card.Description>Calculados con las fórmulas de Investigación de Operaciones</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(result.results).map(([key, value]) => {
                  const label = RESULT_LABELS[key] ?? key;
                  const isCosto = label.includes("CT") || label.includes("Costo") || label.includes("Ahorro") || label === "CT";
                  return (
                    <div key={key} className="rounded-lg border border-default-200 bg-default-50 px-3 py-2">
                      <Typography className="text-xs" color="muted" type="body-sm">{label}</Typography>
                      <Typography className="text-sm font-semibold tabular-nums" type="body">
                        {isCosto ? fmtCurrency(value) : fmtDecimal(value, 4)}
                      </Typography>
                    </div>
                  );
                })}
              </div>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="tertiary" onPress={handleClear}>
              <X className="size-4" />Probar otra imagen
            </Button>
            <Button variant="primary" size="lg" onPress={handleRedirectToForm}>
              Cargar en formulario <ArrowRight className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
