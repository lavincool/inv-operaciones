"use client";

import { useMemo, useState, useCallback, useLayoutEffect } from "react";
import "katex/dist/katex.min.css";
import {
  Button,
  Card,
  Label,
  Modal,
  NumberField,
  Separator,
  Typography,
} from "@heroui/react";
import {
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  Calendar,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import {
  calculateEOQTaxis,
  type EOQTaxisInput,
  type EOQTaxisOutput,
} from "@/lib/eoq-taxis";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (carrusel de ejemplos)                        */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  demandaMensual: number;
  costoOrden: number;
  costoMantener: number;
  costoEscasez: number;
  costoMantenerDescuento: number;
}

interface ExampleInfo {
  title: string;
  subtitle: string;
  enunciado: string;
  datos: string[];
}

const EXAMPLE_INFO: ExampleInfo[] = [
  {
    title: "Inciso a — EOQ Basico sin Faltantes",
    subtitle: "Compania de taxis — Sin escasez permitida",
    enunciado:
      "Una compania de taxis consume <strong class='text-accent'>8000 galones</strong> de gasolina al mes. El costo de colocar una orden es de <strong class='text-accent'>$1200</strong>. El costo de mantener un galon en inventario es de <strong class='text-accent'>$0.02</strong> por galon por mes. No se permiten faltantes.",
    datos: [
      "d = 8000 galones/mes",
      "s = $1,200 / orden",
      "h = $0.02 / galon / mes",
      "p = No aplica (sin escasez)",
    ],
  },
  {
    title: "Inciso b — EOQ con Faltantes Permitidos",
    subtitle: "Compania de taxis — Con escasez planeada",
    enunciado:
      "Con los mismos datos del inciso anterior, ahora se <strong class='text-accent'>permiten faltantes</strong> con un costo de <strong class='text-accent'>$0.70</strong> por galon por mes. Determine la cantidad optima de pedido, el inventario maximo, el agotamiento maximo y los tiempos del ciclo.",
    datos: [
      "d = 8000 galones/mes",
      "s = $1,200 / orden",
      "h = $0.02 / galon / mes",
      "p = $0.70 / galon / mes",
    ],
  },
  {
    title: "Parte 2 — EOQ con Descuento por Volumen",
    subtitle: "Compania de taxis — Cambio en costo de mantener",
    enunciado:
      "El precio por galon baja a <strong class='text-accent'>$0.80</strong>. El costo de mantener cambia proporcionalmente, resultando en un nuevo costo de mantener de <strong class='text-accent'>h = $0.016</strong> por galon por mes. Sin faltantes permitidos. Determine la nueva cantidad optima de pedido.",
    datos: [
      "d = 8000 galones/mes",
      "s = $1,200 / orden",
      "h original = $0.02 / galon / mes",
      "h con descuento = $0.016 / galon / mes",
      "p = No aplica (sin escasez)",
    ],
  },
];

const DEFAULT_PARAMS: DefaultParams[] = [
  {
    demandaMensual: 8000,
    costoOrden: 1200,
    costoMantener: 0.02,
    costoEscasez: 0,
    costoMantenerDescuento: 0,
  },
  {
    demandaMensual: 8000,
    costoOrden: 1200,
    costoMantener: 0.02,
    costoEscasez: 0.7,
    costoMantenerDescuento: 0,
  },
  {
    demandaMensual: 8000,
    costoOrden: 1200,
    costoMantener: 0.02,
    costoEscasez: 0,
    costoMantenerDescuento: 0.016,
  },
];

/* ------------------------------------------------------------------ */
/*  Formateo                                                          */
/* ------------------------------------------------------------------ */

const CURRENCY_FMT: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", CURRENCY_FMT).format(value);
}

function fmtDecimal(value: number, decimals = 4): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ------------------------------------------------------------------ */
/*  Renderizado de LaTeX con KaTeX                                    */
/* ------------------------------------------------------------------ */

function LatexFormula({ latex }: { latex: string }) {
  const [html, setHtml] = useState<string>("");

  useLayoutEffect(() => {
    let cancelled = false;
    import("katex")
      .then((m) => m.default)
      .then((katex) => {
        if (cancelled) return;
        setHtml(
          katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
            output: "htmlAndMathml",
          }),
        );
      })
      .catch(() => {
        // Silently fail for malformed LaTeX
      });
    return () => {
      cancelled = true;
    };
  }, [latex]);

  return (
    <div
      className="overflow-x-auto py-1"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Bloque de paso individual                                         */
/* ------------------------------------------------------------------ */

function PasoDesglose({ label, latex }: { label: string; latex: string }) {
  return (
    <div className="space-y-1.5">
      <Typography
        className="text-xs font-semibold uppercase tracking-wider"
        color="muted"
        type="body-sm"
      >
        {label}
      </Typography>
      <div className="rounded-lg border border-default-200 bg-default-50 p-3">
        <LatexFormula latex={latex} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Campo parametrizado (wrapper de NumberField)                      */
/* ------------------------------------------------------------------ */

interface ParamFieldProps {
  label: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  step: number;
  formatOptions?: Intl.NumberFormatOptions;
  onChange: (v: number) => void;
}

function ParamField({
  label,
  value,
  minValue = 0,
  maxValue,
  step,
  formatOptions,
  onChange,
}: ParamFieldProps) {
  return (
    <NumberField
      isRequired
      formatOptions={formatOptions}
      maxValue={maxValue}
      minValue={minValue}
      step={step}
      value={value}
      onChange={onChange}
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagina principal                                                  */
/* ------------------------------------------------------------------ */

export default function EOQTaxisPage() {
  /* ---- indice del ejemplo actual ---- */
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDefaults = DEFAULT_PARAMS[currentIndex];
  const currentExample = EXAMPLE_INFO[currentIndex];

  /* ---- estado ---- */
  const [demandaMensual, setDemandaMensual] = useState(currentDefaults.demandaMensual);
  const [costoOrden, setCostoOrden] = useState(currentDefaults.costoOrden);
  const [costoMantener, setCostoMantener] = useState(currentDefaults.costoMantener);
  const [costoEscasez, setCostoEscasez] = useState(currentDefaults.costoEscasez);
  const [costoMantenerDescuento, setCostoMantenerDescuento] = useState(
    currentDefaults.costoMantenerDescuento,
  );
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  /* ---- calculos ---- */
  const input: EOQTaxisInput = useMemo(
    () => ({
      demandaMensual,
      costoOrden,
      costoMantener,
      costoEscasez,
      costoMantenerDescuento,
    }),
    [demandaMensual, costoOrden, costoMantener, costoEscasez, costoMantenerDescuento],
  );

  const result: EOQTaxisOutput | null = useMemo(() => {
    try {
      return calculateEOQTaxis(input);
    } catch {
      return null;
    }
  }, [input]);

  /* ---- carga de ejemplo por indice ---- */
  const loadExample = useCallback(
    (index: number) => {
      if (index < 0 || index >= DEFAULT_PARAMS.length) return;
      const p = DEFAULT_PARAMS[index];
      setCurrentIndex(index);
      setDemandaMensual(p.demandaMensual);
      setCostoOrden(p.costoOrden);
      setCostoMantener(p.costoMantener);
      setCostoEscasez(p.costoEscasez);
      setCostoMantenerDescuento(p.costoMantenerDescuento);
    },
    [],
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < DEFAULT_PARAMS.length - 1;

  /* ---- es el valor por defecto? ---- */
  const isDefault = useMemo(() => {
    return (
      demandaMensual === currentDefaults.demandaMensual &&
      costoOrden === currentDefaults.costoOrden &&
      costoMantener === currentDefaults.costoMantener &&
      costoEscasez === currentDefaults.costoEscasez &&
      costoMantenerDescuento === currentDefaults.costoMantenerDescuento
    );
  }, [
    demandaMensual,
    costoOrden,
    costoMantener,
    costoEscasez,
    costoMantenerDescuento,
    currentDefaults,
  ]);

  const handleReset = useCallback(() => {
    setDemandaMensual(currentDefaults.demandaMensual);
    setCostoOrden(currentDefaults.costoOrden);
    setCostoMantener(currentDefaults.costoMantener);
    setCostoEscasez(currentDefaults.costoEscasez);
    setCostoMantenerDescuento(currentDefaults.costoMantenerDescuento);
  }, [currentDefaults]);

  /* ---- render ---- */
  const hayEscasez = result && result.inventarioMaximo !== null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Breadcrumb + header */}
      <div className="mb-8">
        <Link
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeft className="size-3.5" />
          <span>Inicio</span>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <Typography type="h1">Modelo EOQ Avanzado (Basico, Escasez y Descuentos)</Typography>
            <Typography className="mt-2" color="muted" type="body">
              Calcula la cantidad optima de pedido evaluando escenarios sin faltantes, con escasez
              permitida y con descuentos por volumen, utilizando tasas mensuales
            </Typography>
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => setIsExampleOpen(true)}
            >
              <BookOpen className="size-3.5" />
              Leer ejemplo de ejercicio
            </Button>
          </div>

          {/* Carrusel de ejemplos */}
          {DEFAULT_PARAMS.length > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                isDisabled={!hasPrev}
                size="sm"
                variant="tertiary"
                onPress={() => loadExample(currentIndex - 1)}
              >
                <ArrowLeft className="size-3.5" />
              </Button>
              <Typography className="text-xs tabular-nums" color="muted" type="body-sm">
                {currentIndex + 1} / {DEFAULT_PARAMS.length}
              </Typography>
              <Button
                isDisabled={!hasNext}
                size="sm"
                variant="tertiary"
                onPress={() => loadExample(currentIndex + 1)}
              >
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Parametros */}
      <Card className="mb-8">
        <Card.Header>
          <div className="flex w-full items-center justify-between">
            <div>
              <Card.Title>Parametros del Modelo</Card.Title>
              <Card.Description>
                Ajuste los valores del sistema para calcular la cantidad optima de pedido
              </Card.Description>
            </div>
            <Button isDisabled={isDefault} size="sm" variant="tertiary" onPress={handleReset}>
              <RotateCcw className="size-3.5" />
              Restablecer
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Parametros del Sistema
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ParamField
                  label="d &mdash; Demanda Mensual (gal/mes)"
                  maxValue={10000000}
                  minValue={0}
                  step={100}
                  value={demandaMensual}
                  onChange={setDemandaMensual}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="s &mdash; Costo de Orden"
                  maxValue={1000000}
                  minValue={0}
                  step={1}
                  value={costoOrden}
                  onChange={setCostoOrden}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="h &mdash; Costo de Mantener"
                  maxValue={1000000}
                  minValue={0}
                  step={0.001}
                  value={costoMantener}
                  onChange={setCostoMantener}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="p &mdash; Costo de Escasez (opcional)"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoEscasez}
                  onChange={setCostoEscasez}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="h&#8321; &mdash; h con Descuento (opcional)"
                  maxValue={1000000}
                  minValue={0}
                  step={0.001}
                  value={costoMantenerDescuento}
                  onChange={setCostoMantenerDescuento}
                />
              </div>

              {/* Preview de h efectivo */}
              {result && (
                <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                  <Typography className="text-xs" color="muted" type="body-sm">
                    {costoMantenerDescuento > 0 ? (
                      <>
                        h efectivo = h&#8321; (con descuento) ={" "}
                        {fmtCurrency(result.hEfectivo)}{" "}
                        / unidad / mes
                      </>
                    ) : (
                      <>
                        h efectivo = h = {fmtCurrency(result.hEfectivo)}{" "}
                        / unidad / mes
                      </>
                    )}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Resultados */}
      {result && (
        <>
          <div className="mb-6">
            <Typography type="h2">Resultados</Typography>
            <Typography className="mt-1" color="muted" type="body-sm">
              Cantidad optima de pedido, niveles de inventario y tiempos del ciclo de
              reabastecimiento
            </Typography>
          </div>

          {/* Tarjetas principales: Q */}
          <div className="mb-8">
            <Card variant="tertiary" className="ring-2 ring-accent/50 shadow-lg shadow-accent/5">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Package className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Cantidad Optima (Q)</Card.Title>
                    <Card.Description>Tamano del lote a pedir</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-2xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.cantidadOptima, 4)} unidades
                </Typography>
              </Card.Content>
            </Card>
          </div>

          {/* Tarjetas secundarias: S_m y w (solo si hay escasez) */}
          {hayEscasez && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card variant="tertiary">
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
                      <Layers className="size-4.5" />
                    </div>
                    <div>
                      <Card.Title>Inventario Maximo (S&#8345;)</Card.Title>
                      <Card.Description>Stock maximo alcanzado</Card.Description>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <Typography className="text-2xl font-bold tabular-nums" type="body">
                    {fmtDecimal(result.inventarioMaximo!, 4)} unidades
                  </Typography>
                </Card.Content>
              </Card>

              <Card variant="tertiary">
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                      <AlertTriangle className="size-4.5" />
                    </div>
                    <div>
                      <Card.Title>Faltante Maximo (w)</Card.Title>
                      <Card.Description>Agotamiento maximo</Card.Description>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <Typography className="text-2xl font-bold tabular-nums" type="body">
                    {fmtDecimal(result.faltanteMaximo!, 4)} unidades
                  </Typography>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Tarjetas de tiempos */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <Clock className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Tiempo Total (t)</Card.Title>
                    <Card.Description>Tiempo entre ordenes</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-2xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.tiempoEntreOrdenes, 4)} meses
                </Typography>
              </Card.Content>
            </Card>

            {hayEscasez && (
              <>
                <Card variant="tertiary">
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                        <Calendar className="size-4.5" />
                      </div>
                      <div>
                        <Card.Title>Tiempo Inventario (t&#8321;)</Card.Title>
                        <Card.Description>Tiempo con stock</Card.Description>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <Typography className="text-2xl font-bold tabular-nums" type="body">
                      {fmtDecimal(result.tiempoInventario!, 4)} meses
                    </Typography>
                  </Card.Content>
                </Card>

                <Card variant="tertiary">
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-danger/15 text-danger">
                        <AlertTriangle className="size-4.5" />
                      </div>
                      <div>
                        <Card.Title>Tiempo Faltante (t&#8322;)</Card.Title>
                        <Card.Description>Tiempo en escasez</Card.Description>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <Typography className="text-2xl font-bold tabular-nums" type="body">
                      {fmtDecimal(result.tiempoFaltante!, 4)} meses
                    </Typography>
                  </Card.Content>
                </Card>
              </>
            )}
          </div>

          {/* Desglose de calculos */}
          <Card>
            <Card.Header>
              <Card.Title>Desglose de Calculos</Card.Title>
              <Card.Description>
                Sustitucion de variables paso a paso con formulas en notacion matematica
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <PasoDesglose
                  label={
                    hayEscasez
                      ? "Cantidad Optima de Pedido — EOQ con Escasez"
                      : "Cantidad Optima de Pedido (Q)"
                  }
                  latex={result.desgloses.Q}
                />

                {hayEscasez && result.desgloses.Sm && (
                  <>
                    <Separator />
                    <PasoDesglose
                      label="Inventario Maximo (S&#8345;)"
                      latex={result.desgloses.Sm}
                    />
                  </>
                )}

                {hayEscasez && result.desgloses.w && (
                  <>
                    <Separator />
                    <PasoDesglose
                      label="Faltante Maximo (w)"
                      latex={result.desgloses.w}
                    />
                  </>
                )}

                <Separator />
                <PasoDesglose
                  label="Tiempo Total entre Ordenes (t)"
                  latex={result.desgloses.t}
                />

                {hayEscasez && result.desgloses.t1 && (
                  <>
                    <Separator />
                    <PasoDesglose
                      label="Tiempo de Inventario Positivo (t&#8321;)"
                      latex={result.desgloses.t1}
                    />
                  </>
                )}

                {hayEscasez && result.desgloses.t2 && (
                  <>
                    <Separator />
                    <PasoDesglose
                      label="Tiempo de Agotamiento (t&#8322;)"
                      latex={result.desgloses.t2}
                    />
                  </>
                )}
              </div>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Error state */}
      {!result && (
        <Card className="border border-danger/30 bg-danger/5">
          <Card.Content className="py-8 text-center">
            <Typography color="muted" type="body">
              Verifique que todos los parametros sean validos (Demanda, Costo de Orden y Costo de
              Mantener mayores a cero, Costo de Escasez y h con Descuento no negativos).
            </Typography>
          </Card.Content>
        </Card>
      )}

      {/* Modal: Ejemplo de ejercicio */}
      <Modal.Backdrop isOpen={isExampleOpen} onOpenChange={setIsExampleOpen}>
        <Modal.Container scroll="inside" size="lg">
          <Modal.Dialog className="sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{currentExample.title}</Modal.Heading>
              <p className="text-sm text-muted">{currentExample.subtitle}</p>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-6">
                {/* Enunciado */}
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                  <Typography
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Enunciado
                  </Typography>
                  <Typography className="text-sm leading-relaxed" type="body">
                    <span
                      dangerouslySetInnerHTML={{ __html: currentExample.enunciado }}
                    />
                  </Typography>
                </div>

                {/* Datos */}
                <div className="rounded-lg border border-default-200 bg-default-50 p-4">
                  <Typography
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Datos del Problema
                  </Typography>
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {currentExample.datos.map((dato) => (
                      <div key={dato}>
                        <strong>{dato.split(" = ")[0]}</strong> = {dato.split(" = ")[1] ?? dato}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg border border-default-200 bg-default-50 p-4">
                  <Typography
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Resultados Esperados
                  </Typography>
                  <Typography className="text-sm" type="body">
                    Seleccione el ejemplo correspondiente en el carrusel y presione
                    &quot;Restablecer&quot; para cargar los datos y verificar los resultados
                    calculados por el modelo.
                  </Typography>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
