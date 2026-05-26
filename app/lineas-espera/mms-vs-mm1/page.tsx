"use client";

import { useMemo, useState, useCallback, useLayoutEffect } from "react";
import "katex/dist/katex.min.css";
import {
  Button,
  Card,
  Chip,
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
  Clock,
  Users,
  TrendingDown,
  BookOpen,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import {
  calculateMMSvsMM1,
  type MMSvsMM1Input,
  type MMSvsMM1Output,
} from "@/lib/mms-vs-mm1";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (carrusel de ejemplos)                        */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  tasaLlegada: number;
  tasaServicio: number;
  numeroServidores: number;
}

interface ExampleInfo {
  title: string;
  subtitle: string;
  enunciado: string;
  datos: string[];
}

const EXAMPLE_INFO: ExampleInfo[] = [
  {
    title: "El Fantastic Styling Salon",
    subtitle: "Comparacion M/M/s vs M/M/1 — Filas Comunes vs Separadas",
    enunciado:
      "Los clientes llegan al Fantastic Styling Salon en promedio a una tasa de <strong class='text-accent'>8 por hora</strong>. El salon cuenta con <strong class='text-accent'>2 estilistas</strong> quienes pueden atender a los clientes en un promedio de <strong class='text-accent'>5 por hora</strong>. Compare la eficiencia de mantener una sola fila comun versus filas individuales para cada estilista.",
    datos: [
      "λ = 8 clientes/hora",
      "μ = 5 clientes/hora",
      "s = 2 servidores",
    ],
  },
];

const DEFAULT_PARAMS: DefaultParams[] = [
  {
    tasaLlegada: 8,
    tasaServicio: 5,
    numeroServidores: 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Formateo                                                          */
/* ------------------------------------------------------------------ */

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

export default function MMSvsMM1Page() {
  /* ---- indice del ejemplo actual ---- */
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDefaults = DEFAULT_PARAMS[currentIndex];
  const currentExample = EXAMPLE_INFO[currentIndex];

  /* ---- estado ---- */
  const [tasaLlegada, setTasaLlegada] = useState(currentDefaults.tasaLlegada);
  const [tasaServicio, setTasaServicio] = useState(currentDefaults.tasaServicio);
  const [numeroServidores, setNumeroServidores] = useState(
    currentDefaults.numeroServidores,
  );
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  /* ---- calculos ---- */
  const input: MMSvsMM1Input = useMemo(
    () => ({ tasaLlegada, tasaServicio, numeroServidores }),
    [tasaLlegada, tasaServicio, numeroServidores],
  );

  const result: MMSvsMM1Output | null = useMemo(() => {
    try {
      return calculateMMSvsMM1(input);
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
      setTasaLlegada(p.tasaLlegada);
      setTasaServicio(p.tasaServicio);
      setNumeroServidores(p.numeroServidores);
    },
    [],
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < DEFAULT_PARAMS.length - 1;

  /* ---- es el valor por defecto? ---- */
  const isDefault = useMemo(() => {
    return (
      tasaLlegada === currentDefaults.tasaLlegada &&
      tasaServicio === currentDefaults.tasaServicio &&
      numeroServidores === currentDefaults.numeroServidores
    );
  }, [tasaLlegada, tasaServicio, numeroServidores, currentDefaults]);

  const handleReset = useCallback(() => {
    setTasaLlegada(currentDefaults.tasaLlegada);
    setTasaServicio(currentDefaults.tasaServicio);
    setNumeroServidores(currentDefaults.numeroServidores);
  }, [currentDefaults]);

  /* ---- formateo de tiempos ---- */
  function fmtMinSec(minutes: number): string {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    if (s === 60) return `${m + 1}m 0s`;
    return `${m}m ${s}s`;
  }

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
            <Typography type="h1">
              Comparacion de Sistemas M/M/s vs M/M/1
            </Typography>
            <Typography className="mt-2" color="muted" type="body">
              Filas Comunes vs Separadas &middot; Analisis comparativo de
              tiempos de espera entre una sola fila compartida y filas
              individuales por servidor
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
        </div>
      </div>

      {/* Parametros */}
      <Card className="mb-8">
        <Card.Header>
          <div className="flex w-full items-center justify-between">
            <div>
              <Card.Title>Parametros del Modelo</Card.Title>
              <Card.Description>
                Ajuste los valores del sistema para comparar los tiempos de espera
              </Card.Description>
            </div>
            <Button
              isDisabled={isDefault}
              size="sm"
              variant="tertiary"
              onPress={handleReset}
            >
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ParamField
                  label="&lambda; &mdash; Tasa de Llegada (clientes/hora)"
                  maxValue={1000}
                  minValue={0.001}
                  step={1}
                  value={tasaLlegada}
                  onChange={setTasaLlegada}
                />
                <ParamField
                  label="&mu; &mdash; Tasa de Servicio (clientes/hora)"
                  maxValue={1000}
                  minValue={0.001}
                  step={1}
                  value={tasaServicio}
                  onChange={setTasaServicio}
                />
                <ParamField
                  label="s &mdash; Numero de Servidores"
                  maxValue={20}
                  minValue={1}
                  step={1}
                  value={numeroServidores}
                  onChange={(v) => setNumeroServidores(Math.round(v))}
                />
              </div>

              {/* Preview de utilizacion */}
              {result && (
                <div className="mt-3 flex items-center gap-2">
                  <Typography className="text-xs" color="muted" type="body-sm">
                    Factor de utilizacion (&rho;):
                  </Typography>
                  <Chip
                    color={
                      result.utilizacion >= 1
                        ? "danger"
                        : result.utilizacion >= 0.7
                          ? "warning"
                          : "success"
                    }
                    size="sm"
                    variant="soft"
                  >
                    &rho; = {fmtDecimal(result.utilizacion, 4)}
                  </Chip>
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
              Comparacion de tiempos de espera entre fila unica (M/M/s) y filas
              separadas (M/M/1)
            </Typography>
          </div>

          {/* Metricas clave comparadas */}
          <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Fila unica M/M/s */}
            <Card
              variant="tertiary"
              className="ring-2 ring-success/50 shadow-lg shadow-success/5"
            >
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
                    <Users className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Fila Unica (M/M/s)</Card.Title>
                    <Card.Description>
                      Una sola fila para {numeroServidores} servidor
                      {numeroServidores > 1 ? "es" : ""}
                    </Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Lq (Clientes en Fila)
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {fmtDecimal(result.lqUnico, 4)}
                    </dd>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Wq (Tiempo de Espera)
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {fmtDecimal(result.wqUnicoHoras, 4)} h
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Wq (Tiempo de Espera)
                    </dt>
                    <dd className="text-base font-semibold tabular-nums text-success">
                      {fmtMinSec(result.wqUnicoMinutos)}
                    </dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>

            {/* Filas separadas M/M/1 */}
            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <Clock className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Filas Separadas (M/M/1)</Card.Title>
                    <Card.Description>
                      &lambda;&#7522; = {fmtDecimal(result.wqSeparadoHoras > 0 ? tasaLlegada / numeroServidores : 0, 4)}{" "}
                      clientes/hora por servidor
                    </Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Wq (Tiempo de Espera)
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {fmtDecimal(result.wqSeparadoHoras, 4)} h
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Wq (Tiempo de Espera)
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {fmtMinSec(result.wqSeparadoMinutos)}
                    </dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>
          </div>

          {/* Conclusion */}
          <Card className="mb-8">
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <TrendingDown className="size-4.5" />
                </div>
                <div>
                  <Card.Title>Conclusion</Card.Title>
                  <Card.Description>
                    Analisis de eficiencia entre ambos sistemas
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="rounded-xl bg-success/10 border border-success/20 p-4">
                  <Typography className="text-sm leading-relaxed" type="body">
                    {result.conclusion}
                  </Typography>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-default-200 bg-default-50 p-3 text-center">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      Tiempo con Fila Unica
                    </Typography>
                    <Typography className="text-lg font-bold tabular-nums text-success" type="body">
                      {fmtMinSec(result.wqUnicoMinutos)}
                    </Typography>
                  </div>
                  <div className="rounded-lg border border-default-200 bg-default-50 p-3 text-center">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      Tiempo con Filas Separadas
                    </Typography>
                    <Typography className="text-lg font-bold tabular-nums" type="body">
                      {fmtMinSec(result.wqSeparadoMinutos)}
                    </Typography>
                  </div>
                  <div className="rounded-lg border border-default-200 bg-default-50 p-3 text-center">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      Mejora con Fila Unica
                    </Typography>
                    <Typography className="text-lg font-bold tabular-nums text-success" type="body">
                      {result.wqSeparadoMinutos > 0
                        ? fmtDecimal(
                            ((result.wqSeparadoMinutos - result.wqUnicoMinutos) /
                              result.wqSeparadoMinutos) *
                              100,
                            1,
                          ) + "%"
                        : "N/A"}
                    </Typography>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Desglose de calculos */}
          <Card>
            <Card.Header>
              <Card.Title>Desglose de Calculos</Card.Title>
              <Card.Description>
                Sustitucion de variables paso a paso con formulas en notacion
                matematica
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <PasoDesglose
                  label="Factor de Utilizacion (&rho;)"
                  latex={result.desgloses.rho}
                />
                <Separator />
                <PasoDesglose
                  label="Probabilidad de Sistema Vacio (P&#8320;)"
                  latex={result.desgloses.P0}
                />
                <Separator />
                <PasoDesglose
                  label="Clientes en Fila Unica (Lq)"
                  latex={result.desgloses.Lq}
                />
                <Separator />
                <PasoDesglose
                  label="Tiempo de Espera — Fila Unica (Wq M/M/s)"
                  latex={result.desgloses.WqUnico}
                />
                <Separator />
                <PasoDesglose
                  label="Tasa de Llegada por Servidor (&lambda;&#7522;)"
                  latex={result.desgloses.lambdaI}
                />
                <Separator />
                <PasoDesglose
                  label="Tiempo de Espera — Filas Separadas (Wq M/M/1)"
                  latex={result.desgloses.WqSeparado}
                />
              </div>

              {/* Leyenda de interpretacion */}
              <div className="mt-6 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Interpretacion:</strong> El tiempo de espera en la fila
                  unica (M/M/s) es de{" "}
                  <strong>{fmtMinSec(result.wqUnicoMinutos)}</strong>, mientras que
                  en las filas separadas (M/M/1 dividido) es de{" "}
                  <strong>{fmtMinSec(result.wqSeparadoMinutos)}</strong>. La fila
                  unica es mas eficiente porque cuando un servidor queda libre,
                  atiende inmediatamente al siguiente cliente de la fila comun,
                  evitando tiempos muertos.
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
              Verifique que el sistema sea estable (&rho; &lt; 1). La tasa de
              llegada (&lambda;) debe ser menor que el producto de servidores por
              tasa de servicio (s &middot; &mu;).
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
                      dangerouslySetInnerHTML={{
                        __html: currentExample.enunciado,
                      }}
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
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    {currentExample.datos.map((dato) => (
                      <div key={dato}>
                        <strong>{dato.split(" = ")[0]}</strong> ={" "}
                        {dato.split(" = ")[1] ?? dato}
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
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <strong>&rho;</strong> = 0.8000
                    </div>
                    <div>
                      <strong>P&#8320;</strong> = 0.1111
                    </div>
                    <div>
                      <strong>Lq</strong> = 2.8444
                    </div>
                    <div>
                      <strong>Wq (M/M/s)</strong> = 0.3556 horas = 21.3333
                      min
                    </div>
                    <div>
                      <strong>Wq (M/M/1)</strong> = 0.8000 horas = 48.0000
                      min
                    </div>
                  </div>
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
