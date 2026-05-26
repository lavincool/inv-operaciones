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
  Factory,
  Repeat,
  TrendingUp,
  Calendar,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import {
  calculateEPQ,
  type EPQInput,
  type EPQOutput,
} from "@/lib/epq";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (carrusel de ejemplos)                        */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  demandaAnual: number;
  costoPreparacion: number;
  costoMantenimiento: number;
  tasaProduccion: number;
  diasHabiles: number;
}

const DEFAULT_PARAMS: DefaultParams[] = [
  {
    demandaAnual: 12000,
    costoPreparacion: 20,
    costoMantenimiento: 5,
    tasaProduccion: 30000,
    diasHabiles: 300,
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

export default function EPQPage() {
  /* ---- indice del ejemplo actual ---- */
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDefaults = DEFAULT_PARAMS[currentIndex];

  /* ---- estado ---- */
  const [demandaAnual, setDemandaAnual] = useState(currentDefaults.demandaAnual);
  const [costoPreparacion, setCostoPreparacion] = useState(
    currentDefaults.costoPreparacion,
  );
  const [costoMantenimiento, setCostoMantenimiento] = useState(
    currentDefaults.costoMantenimiento,
  );
  const [tasaProduccion, setTasaProduccion] = useState(
    currentDefaults.tasaProduccion,
  );
  const [diasHabiles, setDiasHabiles] = useState(currentDefaults.diasHabiles);
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  /* ---- calculos ---- */
  const input: EPQInput = useMemo(
    () => ({
      demandaAnual,
      costoPreparacion,
      costoMantenimiento,
      tasaProduccion,
      diasHabiles,
    }),
    [demandaAnual, costoPreparacion, costoMantenimiento, tasaProduccion, diasHabiles],
  );

  const result: EPQOutput | null = useMemo(() => {
    try {
      return calculateEPQ(input);
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
      setCostoPreparacion(p.costoPreparacion);
      setCostoMantenimiento(p.costoMantenimiento);
      setTasaProduccion(p.tasaProduccion);
      setDiasHabiles(p.diasHabiles);
    },
    [],
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < DEFAULT_PARAMS.length - 1;

  /* ---- es el valor por defecto? ---- */
  const isDefault = useMemo(() => {
    return (
      demandaAnual === currentDefaults.demandaAnual &&
      costoPreparacion === currentDefaults.costoPreparacion &&
      costoMantenimiento === currentDefaults.costoMantenimiento &&
      tasaProduccion === currentDefaults.tasaProduccion &&
      diasHabiles === currentDefaults.diasHabiles
    );
  }, [
    demandaAnual,
    costoPreparacion,
    costoMantenimiento,
    tasaProduccion,
    diasHabiles,
    currentDefaults,
  ]);

  const handleReset = useCallback(() => {
    setDemandaAnual(currentDefaults.demandaAnual);
    setCostoPreparacion(currentDefaults.costoPreparacion);
    setCostoMantenimiento(currentDefaults.costoMantenimiento);
    setTasaProduccion(currentDefaults.tasaProduccion);
    setDiasHabiles(currentDefaults.diasHabiles);
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
            <Typography type="h1">Modelo EPQ (Lote Economico de Produccion)</Typography>
            <Typography className="mt-2" color="muted" type="body">
              Calculo del lote optimo de produccion cuando el inventario se repone gradualmente en lugar de instantaneamente
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
                Ajuste los valores del sistema para calcular el lote optimo de produccion
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
                  label="S &mdash; Costo de Preparacion"
                  maxValue={1000000}
                  minValue={0}
                  step={1}
                  value={costoPreparacion}
                  onChange={setCostoPreparacion}
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
                  label="P &mdash; Tasa de Produccion Anual"
                  maxValue={10000000}
                  minValue={0}
                  step={100}
                  value={tasaProduccion}
                  onChange={setTasaProduccion}
                />
                <ParamField
                  label="L &mdash; Dias Habiles / Ano"
                  maxValue={365}
                  minValue={1}
                  step={1}
                  value={diasHabiles}
                  onChange={setDiasHabiles}
                />
              </div>

              {/* Preview del factor de produccion */}
              {(() => {
                const factor = 1 - demandaAnual / tasaProduccion;
                return (
                  <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      1 − D/P = 1 − {demandaAnual.toLocaleString("es-MX")} / {tasaProduccion.toLocaleString("es-MX")} = {fmtDecimal(factor, 4)} (Factor de acumulacion gradual del inventario)
                    </Typography>
                  </div>
                );
              })()}
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
              Lote optimo de produccion y costos del sistema EPQ
            </Typography>
          </div>

          {/* Tarjetas principales: Q y CTA */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card variant="tertiary" className="ring-2 ring-accent/50 shadow-lg shadow-accent/5">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Factory className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Lote Optimo de Produccion (Q)</Card.Title>
                    <Card.Description>Cantidad a producir por corrida</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-2xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.loteOptimo, 4)} unidades
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
                    <Card.Title>Costo Total Anual (CTA)</Card.Title>
                    <Card.Description>Costo de preparacion + mantenimiento</Card.Description>
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

          {/* Tarjetas secundarias: N y T */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <Repeat className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Frecuencia de Corridas (N)</Card.Title>
                    <Card.Description>Corridas de producción al año</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.frecuencia, 4)}
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
                    <Card.Title>Tiempo entre Corridas (T)</Card.Title>
                    <Card.Description>Dias laborables entre corridas</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.tiempoCorridas, 4)} dias
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
                  label="Lote Optimo de Produccion (Q)"
                  latex={result.desgloses.Q}
                />
                <Separator />
                <PasoDesglose
                  label="Frecuencia de Corridas al Ano (N)"
                  latex={result.desgloses.N}
                />
                <Separator />
                <PasoDesglose
                  label="Tiempo entre Corridas en Dias (T)"
                  latex={result.desgloses.T}
                />
                <Separator />
                <PasoDesglose
                  label="Costo Total Anual (CTA)"
                  latex={result.desgloses.CTA}
                />
              </div>

              {/* Interpretacion */}
              <div className="mt-6 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Interpretacion:</strong> Se debe producir un lote de{" "}
                  <strong>{fmtDecimal(result.loteOptimo, 2)} unidades</strong> por corrida,{" "}
                  realizando <strong>{fmtDecimal(result.frecuencia, 2)} corridas</strong> al año,{" "}
                  con un intervalo de{" "}
                  <strong>{fmtDecimal(result.tiempoCorridas, 2)} dias</strong> entre cada una.{" "}
                  El costo total anual de esta politica es{" "}
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
              Verifique que todos los parametros sean validos (Demanda, Costo de Preparacion, Costo de Mantenimiento y Dias Habiles mayores a cero, y Tasa de Produccion estrictamente mayor que la Demanda).
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
                Compañía Sunrise — Fabricacion interna de refacciones
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
                    La compañía Sunrise ha decidido comenzar a fabricar una refaccion que antes
                    adquiria de un proveedor externo. La demanda es de{" "}
                    <strong className="text-accent">1,000 unidades al mes</strong>, el costo de
                    preparacion por corrida es{" "}
                    <strong className="text-accent">$20</strong> y el costo de mantenimiento es{" "}
                    <strong className="text-accent">$5 por unidad por año</strong>. Una vez que
                    una maquina esta operando, puede fabricar esas partes a razon de{" "}
                    <strong className="text-accent">2,500 unidades por mes</strong>. Por lo
                    general, la compañía opera aproximadamente{" "}
                    <strong className="text-accent">300 días hábiles al año</strong>. A los
                    administradores de la Sunrise les gustaria saber cual es el lote de produccion
                    con el que deben trabajar, con que frecuencia deben realizarse las corridas
                    y el costo total asociado.
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
                    <div><strong>D</strong> = 12,000 unid/año (1,000/mes)</div>
                    <div><strong>S</strong> = $20 / corrida</div>
                    <div><strong>H</strong> = $5 / unid-año</div>
                    <div><strong>P</strong> = 30,000 unid/año (2,500/mes)</div>
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
                    <li>¿Cual es el lote de produccion optimo (Q) con el que deben trabajar?</li>
                    <li>¿Con que frecuencia deben realizarse las corridas de produccion (N)?</li>
                    <li>¿Cual es el tiempo entre corridas en dias (T)?</li>
                    <li>Determine el costo total anual asociado (CTA).</li>
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
