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
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  BookOpen,
  Layers,
} from "lucide-react";
import Link from "next/link";
import {
  calculateEOQEscasez,
  type EOQEscasezInput,
  type EOQEscasezOutput,
} from "@/lib/eoq-escasez";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (carrusel de ejemplos)                        */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  demandaAnual: number;
  costoPedido: number;
  costoMantenimiento: number;
  costoEscasez: number;
  diasLaborables: number;
}

const DEFAULT_PARAMS: DefaultParams[] = [
  {
    demandaAnual: 6000,
    costoPedido: 300,
    costoMantenimiento: 50,
    costoEscasez: 80,
    diasLaborables: 300,
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
    minimumFractionDigits: 0,
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

export default function EOQEscasezPage() {
  /* ---- indice del ejemplo actual ---- */
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDefaults = DEFAULT_PARAMS[currentIndex];

  /* ---- estado ---- */
  const [demandaAnual, setDemandaAnual] = useState(currentDefaults.demandaAnual);
  const [costoPedido, setCostoPedido] = useState(currentDefaults.costoPedido);
  const [costoMantenimiento, setCostoMantenimiento] = useState(
    currentDefaults.costoMantenimiento,
  );
  const [costoEscasez, setCostoEscasez] = useState(
    currentDefaults.costoEscasez,
  );
  const [diasLaborables, setDiasLaborables] = useState(
    currentDefaults.diasLaborables,
  );
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  /* ---- calculos ---- */
  const input: EOQEscasezInput = useMemo(
    () => ({
      demandaAnual,
      costoPedido,
      costoMantenimiento,
      costoEscasez,
      diasLaborables,
    }),
    [demandaAnual, costoPedido, costoMantenimiento, costoEscasez, diasLaborables],
  );

  const result: EOQEscasezOutput | null = useMemo(() => {
    try {
      return calculateEOQEscasez(input);
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
      setDemandaAnual(p.demandaAnual);
      setCostoPedido(p.costoPedido);
      setCostoMantenimiento(p.costoMantenimiento);
      setCostoEscasez(p.costoEscasez);
      setDiasLaborables(p.diasLaborables);
    },
    [],
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < DEFAULT_PARAMS.length - 1;

  /* ---- es el valor por defecto? ---- */
  const isDefault = useMemo(() => {
    return (
      demandaAnual === currentDefaults.demandaAnual &&
      costoPedido === currentDefaults.costoPedido &&
      costoMantenimiento === currentDefaults.costoMantenimiento &&
      costoEscasez === currentDefaults.costoEscasez &&
      diasLaborables === currentDefaults.diasLaborables
    );
  }, [
    demandaAnual,
    costoPedido,
    costoMantenimiento,
    costoEscasez,
    diasLaborables,
    currentDefaults,
  ]);

  const handleReset = useCallback(() => {
    setDemandaAnual(currentDefaults.demandaAnual);
    setCostoPedido(currentDefaults.costoPedido);
    setCostoMantenimiento(currentDefaults.costoMantenimiento);
    setCostoEscasez(currentDefaults.costoEscasez);
    setDiasLaborables(currentDefaults.diasLaborables);
  }, [currentDefaults]);

  /* ---- render ---- */
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
            <Typography type="h1">Modelo EOQ con Faltantes Planeados (Escasez)</Typography>
            <Typography className="mt-2" color="muted" type="body">
              Calculo de la cantidad economica de pedido permitiendo escasez controlada, minimizando costos de ordenar, mantener inventario y penalizaciones por faltantes
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
                Ajuste los valores del sistema para calcular la cantidad optima de pedido con escasez
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
                  label="D &mdash; Demanda Anual"
                  maxValue={10000000}
                  minValue={0}
                  step={100}
                  value={demandaAnual}
                  onChange={setDemandaAnual}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="S &mdash; Costo de Pedido"
                  maxValue={1000000}
                  minValue={0}
                  step={1}
                  value={costoPedido}
                  onChange={setCostoPedido}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="H &mdash; Costo de Mantenimiento"
                  maxValue={1000000}
                  minValue={0}
                  step={1}
                  value={costoMantenimiento}
                  onChange={setCostoMantenimiento}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="P &mdash; Costo de Escasez"
                  maxValue={1000000}
                  minValue={0}
                  step={1}
                  value={costoEscasez}
                  onChange={setCostoEscasez}
                />
                <ParamField
                  label="L &mdash; Días Laborables / año"
                  maxValue={365}
                  minValue={1}
                  step={1}
                  value={diasLaborables}
                  onChange={setDiasLaborables}
                />
              </div>
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
              Cantidad optima de pedido, nivel maximo de inventario y costos del modelo con escasez
            </Typography>
          </div>

          {/* Tarjetas principales: Q y CTA */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <Card variant="tertiary" className="ring-2 ring-success/50 shadow-lg shadow-success/5">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
                    <TrendingUp className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Costo Total Asociado (CTA)</Card.Title>
                    <Card.Description>Costo de ordenar + mantener + escasez</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-2xl font-bold tabular-nums text-success" type="body">
                  {fmtCurrency(result.costoTotal)}
                </Typography>
              </Card.Content>
            </Card>
          </div>

          {/* Tarjetas secundarias: S_max, W, N */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Layers className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Inventario Maximo (S_max)</Card.Title>
                    <Card.Description>Nivel maximo de inventario</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.inventarioMaximo, 4)} unid
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
                    <Card.Title>Escasez Maxima (W)</Card.Title>
                    <Card.Description>Unidades faltantes por ciclo</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.escasezMaxima, 4)} unid
                </Typography>
              </Card.Content>
            </Card>

            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <ShoppingCart className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Pedidos por Ano (N)</Card.Title>
                    <Card.Description>Veces que se ordena anualmente</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.numeroPedidos, 4)}
                </Typography>
              </Card.Content>
            </Card>
          </div>

          {/* Tarjetas de tiempo: T y T_dias */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <Clock className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Tiempo entre Ordenes (T)</Card.Title>
                    <Card.Description>En años</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.tiempoEntreOrdenes, 4)}
                </Typography>
              </Card.Content>
            </Card>

            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <Calendar className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Tiempo entre Ordenes (T_dias)</Card.Title>
                    <Card.Description>En dias laborables</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.tiempoEntreOrdenesDias, 4)} dias
                </Typography>
              </Card.Content>
            </Card>
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
                  label="Cantidad Optima de Pedido (Q)"
                  latex={result.desgloses.Q}
                />
                <Separator />
                <PasoDesglose
                  label="Inventario Maximo (S_max)"
                  latex={result.desgloses.S_max}
                />
                <Separator />
                <PasoDesglose
                  label="Escasez Maxima (W)"
                  latex={result.desgloses.W}
                />
                <Separator />
                <PasoDesglose
                  label="Costo Total Asociado (CTA)"
                  latex={result.desgloses.CTA}
                />
                <Separator />
                <PasoDesglose
                  label="Numero de Pedidos al Ano (N)"
                  latex={result.desgloses.N}
                />
                <Separator />
                <PasoDesglose
                  label="Tiempo entre Ordenes (T)"
                  latex={result.desgloses.T}
                />
                <Separator />
                <PasoDesglose
                  label="Tiempo entre Ordenes en Dias (T_dias)"
                  latex={result.desgloses.T_dias}
                />
              </div>

              {/* Interpretacion */}
              <div className="mt-6 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Interpretacion:</strong> Se debe pedir un lote de{" "}
                  <strong>{fmtDecimal(result.cantidadOptima, 2)} unidades</strong>{" "}
                  cada <strong>{fmtDecimal(result.tiempoEntreOrdenesDias, 2)} dias</strong>.{" "}
                  El nivel maximo de inventario alcanza{" "}
                  <strong>{fmtDecimal(result.inventarioMaximo, 2)} unidades</strong> y se{" "}
                  permite una escasez maxima de{" "}
                  <strong>{fmtDecimal(result.escasezMaxima, 2)} unidades</strong>{" "}
                  por ciclo. El costo total anual de esta politica es{" "}
                  <strong>{fmtCurrency(result.costoTotal)}</strong>.
                </Typography>
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
              Verifique que todos los parametros sean validos (Demanda, Costo de Pedido, Costo de Mantenimiento, Costo de Escasez y Dias Laborables mayores a cero).
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
              <Modal.Heading>Ejemplo de Ejercicio Resuelto</Modal.Heading>
              <p className="text-sm text-muted">
                Componentes electronicos — Modelo EOQ con Faltantes Planeados
              </p>
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
                    Una empresa tiene una demanda anual de{" "}
                    <strong className="text-accent">6,000</strong> unidades de un componente
                    electronico. Cada vez que se coloca una orden se incurre en un costo de{" "}
                    <strong className="text-accent">$300</strong>. El costo anual de mantener
                    una unidad en inventario es de{" "}
                    <strong className="text-accent">$50</strong> y el costo anual por faltante
                    de una unidad es de <strong className="text-accent">$80</strong>. La
                    empresa labora <strong className="text-accent">300</strong> días al año.
                    Se permite la escasez controlada del producto.
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
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <div><strong>D</strong> = 6,000 unid/año</div>
                    <div><strong>S</strong> = $300 / orden</div>
                    <div><strong>H</strong> = $50 / unid-año</div>
                    <div><strong>P</strong> = $80 / unid-año</div>
                    <div><strong>L</strong> = 300 días / año</div>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg border border-default-200 bg-default-50 p-4">
                  <Typography
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Preguntas del Ejercicio
                  </Typography>
                  <ol className="list-inside list-decimal space-y-1 text-sm">
                    <li>Determine la cantidad optima de pedido (Q).</li>
                    <li>Calcule el nivel maximo de inventario (S_max).</li>
                    <li>¿Cual es la escasez maxima (W) por ciclo?</li>
                    <li>Calcule el costo total anual asociado (CTA).</li>
                    <li>Determine el número de pedidos al año (N) y el tiempo entre ordenes (T y T_dias).</li>
                  </ol>
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
