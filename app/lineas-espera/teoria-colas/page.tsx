"use client";

import { useMemo, useState, useCallback, useLayoutEffect } from "react";
import "katex/dist/katex.min.css";
import {
  Button,
  Card,
  Chip,
  Label,
  NumberField,
  Separator,
  Typography,
} from "@heroui/react";
import {
  RotateCcw,
  ArrowLeft,
  Server,
  Users,
  Hash,
  Gauge,
  Clock,
  Infinity,
  Layers,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import {
  calculateQueueTheory,
  type QueueTheoryInput,
  type QueueTheoryOutput,
  type ModelType,
} from "@/lib/queueTheory";

/* ── caracteres griegos ─────────────────────────────────────────────── */

const LAMBDA = "\u03BB";
const MU = "\u03BC";
const RHO = "\u03C1";
const P0 = "P\u2080";
const PN = "P\u2099";

/* ── valores por defecto por modelo ─────────────────────────────────── */

interface Defaults {
  lambda: number;
  mu: number;
  s: number;
  nClientes: number | undefined;
  poblacion: number;
}

const DEFAULTS: Record<ModelType, Defaults> = {
  "single-server": {
    lambda: 2,
    mu: 3,
    s: 2,
    nClientes: 2,
    poblacion: 5,
  },
  "multi-server": {
    lambda: 4,
    mu: 3,
    s: 2,
    nClientes: 3,
    poblacion: 5,
  },
  "finite-source": {
    lambda: 1,
    mu: 2,
    s: 2,
    nClientes: undefined,
    poblacion: 5,
  },
};

const MODELO_LABELS: Record<ModelType, string> = {
  "single-server": "Un Servidor (M/M/1)",
  "multi-server": "Múltiples Servidores (M/M/s)",
  "finite-source": "Fuente Finita",
};

const MODELOS: ModelType[] = ["single-server", "multi-server", "finite-source"];

/* ── formateo ────────────────────────────────────────────────────────── */

function fmtDecimal(value: number, decimals = 4): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/* ── renderizado LaTeX con KaTeX ─────────────────────────────────────── */

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

/* ── bloque de paso individual ───────────────────────────────────────── */

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

/* ── campo parametrizado ─────────────────────────────────────────────── */

interface ParamFieldProps {
  label: React.ReactNode;
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

/* ── indicador de metrica ────────────────────────────────────────────── */

function MetricRow({
  label,
  value,
  decimals = 4,
  highlight,
  icon: Icon,
}: {
  label: React.ReactNode;
  value: number;
  decimals?: number;
  highlight?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-1.5 text-sm text-muted">
        {Icon && <Icon className="size-3.5 shrink-0" />}
        {label}
      </dt>
      <dd
        className={`text-base font-semibold tabular-nums ${highlight ? "text-accent" : ""}`}
      >
        {fmtDecimal(value, decimals)}
      </dd>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Pagina principal
 * ══════════════════════════════════════════════════════════════════════════ */

export default function TeoriaColasPage() {
  const [model, setModel] = useState<ModelType>("single-server");
  const [lambda, setLambda] = useState(DEFAULTS["single-server"].lambda);
  const [mu, setMu] = useState(DEFAULTS["single-server"].mu);
  const [s, setS] = useState(DEFAULTS["single-server"].s);
  const [nClientes, setNClientes] = useState<number | undefined>(
    DEFAULTS["single-server"].nClientes,
  );
  const [poblacion, setPoblacion] = useState(
    DEFAULTS["single-server"].poblacion,
  );

  /* ---- cambiar modelo (carga los defaults del nuevo modelo) ──── */

  const handleChangeModel = useCallback(
    (newModel: ModelType) => {
      const d = DEFAULTS[newModel];
      setModel(newModel);
      setLambda(d.lambda);
      setMu(d.mu);
      setS(d.s);
      setNClientes(d.nClientes);
      setPoblacion(d.poblacion);
    },
    [],
  );

  /* ---- input y resultado ──── */

  const input: QueueTheoryInput = useMemo(
    () => ({
      model,
      lambda,
      mu,
      s,
      nClientes,
      poblacion,
    }),
    [model, lambda, mu, s, nClientes, poblacion],
  );

  const result: QueueTheoryOutput | null = useMemo(() => {
    try {
      return calculateQueueTheory(input);
    } catch {
      return null;
    }
  }, [input]);

  /* ---- reset a defaults del modelo actual ──── */

  const currentDefaults = DEFAULTS[model];

  const isDefault = useMemo(() => {
    return (
      lambda === currentDefaults.lambda &&
      mu === currentDefaults.mu &&
      s === currentDefaults.s &&
      nClientes === currentDefaults.nClientes &&
      poblacion === currentDefaults.poblacion
    );
  }, [lambda, mu, s, nClientes, poblacion, currentDefaults]);

  const handleReset = useCallback(() => {
    setLambda(currentDefaults.lambda);
    setMu(currentDefaults.mu);
    setS(currentDefaults.s);
    setNClientes(currentDefaults.nClientes);
    setPoblacion(currentDefaults.poblacion);
  }, [currentDefaults]);

  /* ── render ──────────────────────────────────────────────────── */

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

        <Typography type="h1">Teoría de Colas</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Cálculo de indicadores de desempeño para sistemas de líneas de espera
          &middot; M/M/1, M/M/s y Fuente Finita
        </Typography>
      </div>

      {/* Selector de modelo */}
      <Card className="mb-8">
        <Card.Content className="py-4">
          <div className="flex flex-wrap gap-2">
            {MODELOS.map((m) => {
              const isActive = model === m;
              return (
                <Button
                  key={m}
                  className="flex items-center gap-2"
                  size="sm"
                  variant={isActive ? "primary" : "tertiary"}
                  onPress={() => handleChangeModel(m)}
                >
                  {m === "single-server" && <Server className="size-3.5" />}
                  {m === "multi-server" && <Layers className="size-3.5" />}
                  {m === "finite-source" && <Users className="size-3.5" />}
                  {MODELO_LABELS[m]}
                </Button>
              );
            })}
          </div>
        </Card.Content>
      </Card>

      {/* Parámetros */}
      <Card className="mb-8">
        <Card.Header>
          <div className="flex w-full items-center justify-between">
            <div>
              <Card.Title>Parámetros del Modelo</Card.Title>
              <Card.Description>
                {model === "single-server" &&
                  "Un solo servidor con llegadas Poisson y tiempos de servicio exponenciales"}
                {model === "multi-server" &&
                  "Varios servidores en paralelo atendiendo una fila común"}
                {model === "finite-source" &&
                  "Fuente de clientes limitada (ej. máquinas que pueden fallar)"}
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
                Tasas del Sistema
              </Typography>
              <div
                className={[
                  "grid grid-cols-1 gap-4",
                  model === "single-server"
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-3",
                ].join(" ")}
              >
                <ParamField
                  formatOptions={{
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }}
                  label={<>{LAMBDA} &mdash; Tasa de Llegada</>}
                  maxValue={1000}
                  minValue={0.001}
                  step={0.01}
                  value={lambda}
                  onChange={setLambda}
                />
                <ParamField
                  formatOptions={{
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }}
                  label={<>{MU} &mdash; Tasa de Servicio</>}
                  maxValue={1000}
                  minValue={0.001}
                  step={0.01}
                  value={mu}
                  onChange={setMu}
                />

                {model === "multi-server" && (
                  <ParamField
                    formatOptions={{
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    label="s &mdash; Número de Servidores"
                    maxValue={50}
                    minValue={1}
                    step={1}
                    value={s}
                    onChange={(v) => setS(Math.round(v))}
                  />
                )}

                {model === "finite-source" && (
                  <ParamField
                    formatOptions={{
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    label="N &mdash; Tamaño de Población"
                    maxValue={100}
                    minValue={1}
                    step={1}
                    value={poblacion}
                    onChange={(v) => setPoblacion(Math.round(v))}
                  />
                )}
              </div>

              {/* Preview de utilización */}
              {result && (
                <div className="mt-3 flex items-center gap-2">
                  <Typography className="text-xs" color="muted" type="body-sm">
                    Factor de utilización ({RHO}):
                  </Typography>
                  <Chip
                    color={
                      result.rho >= 1
                        ? "danger"
                        : result.rho >= 0.7
                          ? "warning"
                          : "success"
                    }
                    size="sm"
                    variant="soft"
                  >
                    {RHO} = {fmtDecimal(result.rho, 4)}
                  </Chip>
                </div>
              )}
            </div>

            {/* nClientes opcional (solo para single y multi) */}
            {(model === "single-server" || model === "multi-server") && (
              <>
                <Separator />
                <div>
                  <Typography
                    className="mb-3 text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Probabilidad de n Clientes (Opcional)
                  </Typography>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ParamField
                      formatOptions={{
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      label={<>n &mdash; N&deg; de clientes (para calcular {PN})</>}
                      maxValue={100}
                      minValue={0}
                      step={1}
                      value={nClientes ?? 0}
                      onChange={(v) =>
                        setNClientes(
                          v >= 0 && Number.isInteger(v) ? v : undefined,
                        )
                      }
                    />
                    <Button
                      className="self-end"
                      size="sm"
                      variant="tertiary"
                      onPress={() => setNClientes(undefined)}
                    >
                      Quitar {PN}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Resultados */}
      {result && (
        <>
          <div className="mb-6">
            <Typography type="h2">Resultados</Typography>
            <Typography className="mt-1" color="muted" type="body-sm">
              Indicadores de desempeño del sistema
            </Typography>
          </div>

          {/* Tarjeta principal de métricas */}
          <Card className="mb-8" variant="tertiary">
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
                  <Gauge className="size-4.5" />
                </div>
                <div>
                  <Card.Title>Métricas del Sistema</Card.Title>
                  <Card.Description>
                    {MODELO_LABELS[model]}
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <dl className="space-y-3">
                <MetricRow
                  icon={Gauge}
                  label={<>{RHO} (Utilización)</>}
                  value={result.rho}
                />
                <Separator />
                <MetricRow
                  icon={Infinity}
                  label={<>{P0} (Prob. Sistema Vacío)</>}
                  value={result.P0}
                />
                <Separator />
                <MetricRow
                  icon={Users}
                  label="L (Clientes en Sistema)"
                  value={result.L}
                />
                <Separator />
                <MetricRow
                  icon={Hash}
                  label="Lq (Clientes en Fila)"
                  value={result.Lq}
                />
                <Separator />
                <MetricRow
                  icon={Clock}
                  label="W (Tiempo en Sistema)"
                  value={result.W}
                />
                <Separator />
                <MetricRow
                  icon={Clock}
                  label="Wq (Tiempo en Fila)"
                  value={result.Wq}
                />
                {result.Pn !== undefined && (
                  <>
                    <Separator />
                    <MetricRow
                      highlight
                      icon={User}
                      label={<>P(n={nClientes}) &mdash; Prob. de {nClientes} clientes</>}
                      value={result.Pn}
                    />
                  </>
                )}
              </dl>
            </Card.Content>
          </Card>

          {/* Tarjetas individuales de métricas clave */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="text-center">
              <Card.Content className="py-4">
                <Typography className="text-xs" color="muted" type="body-sm">
                  {RHO} (Utilización)
                </Typography>
                <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.rho, 4)}
                </Typography>
                <Chip
                  className="mt-2"
                  color={
                    result.rho >= 1
                      ? "danger"
                      : result.rho >= 0.7
                        ? "warning"
                        : "success"
                  }
                  size="sm"
                  variant="soft"
                >
                  {result.rho >= 1
                    ? "Saturado"
                    : result.rho >= 0.7
                      ? "Alto"
                      : "Estable"}
                </Chip>
              </Card.Content>
            </Card>
            <Card className="text-center">
              <Card.Content className="py-4">
                <Typography className="text-xs" color="muted" type="body-sm">
                  L (En Sistema)
                </Typography>
                <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.L, 4)}
                </Typography>
              </Card.Content>
            </Card>
            <Card className="text-center">
              <Card.Content className="py-4">
                <Typography className="text-xs" color="muted" type="body-sm">
                  Lq (En Fila)
                </Typography>
                <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.Lq, 4)}
                </Typography>
              </Card.Content>
            </Card>
            <Card className="text-center">
              <Card.Content className="py-4">
                <Typography className="text-xs" color="muted" type="body-sm">
                  W (Tiempo en Sistema)
                </Typography>
                <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.W, 4)}
                </Typography>
              </Card.Content>
            </Card>
            <Card className="text-center">
              <Card.Content className="py-4">
                <Typography className="text-xs" color="muted" type="body-sm">
                  Wq (Tiempo en Fila)
                </Typography>
                <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.Wq, 4)}
                </Typography>
              </Card.Content>
            </Card>
            <Card className="text-center">
              <Card.Content className="py-4">
                <Typography className="text-xs" color="muted" type="body-sm">
                  {P0} (Sistema Vacío)
                </Typography>
                <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.P0, 4)}
                </Typography>
              </Card.Content>
            </Card>
          </div>

          {/* Desglose de cálculos */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Wrench className="size-4.5" />
                </div>
                <div>
                  <Card.Title>Desglose de Cálculos</Card.Title>
                  <Card.Description>
                    Sustitución de variables paso a paso con fórmulas en
                    notación matemática
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <PasoDesglose
                  label={`Factor de Utilización (${RHO})`}
                  latex={result.desgloses.rho}
                />
                <Separator />
                <PasoDesglose
                  label={`Probabilidad de Sistema Vacío (${P0})`}
                  latex={result.desgloses.P0}
                />
                <Separator />
                <PasoDesglose
                  label="L &mdash; Clientes en el Sistema"
                  latex={result.desgloses.L}
                />
                <Separator />
                <PasoDesglose
                  label="Lq &mdash; Clientes en la Fila"
                  latex={result.desgloses.Lq}
                />
                <Separator />
                <PasoDesglose
                  label="W &mdash; Tiempo Promedio en el Sistema"
                  latex={result.desgloses.W}
                />
                <Separator />
                <PasoDesglose
                  label="Wq &mdash; Tiempo Promedio en la Fila"
                  latex={result.desgloses.Wq}
                />
                {result.desgloses.Pn && (
                  <>
                    <Separator />
                    <PasoDesglose
                      label={`P(n=${nClientes}) &mdash; Probabilidad de ${nClientes} clientes`}
                      latex={result.desgloses.Pn}
                    />
                  </>
                )}
              </div>

              {/* Leyenda de interpretación */}
              <div className="mt-6 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Interpretación:</strong>{" "}
                  {model === "single-server" &&
                    `Con ${LAMBDA} = ${fmtDecimal(lambda, 2)} y ${MU} = ${fmtDecimal(mu, 2)}, el sistema opera al ${fmtDecimal(result.rho * 100, 1)}% de su capacidad. ` +
                    `En promedio, hay ${fmtDecimal(result.L, 2)} clientes en el sistema y cada uno pasa ${fmtDecimal(result.W, 3)} unidades de tiempo en el sistema.`}
                  {model === "multi-server" &&
                    `Con ${s} servidores, ${LAMBDA} = ${fmtDecimal(lambda, 2)} y ${MU} = ${fmtDecimal(mu, 2)}, el sistema opera al ${fmtDecimal(result.rho * 100, 1)}% de su capacidad. ` +
                    `La probabilidad de encontrar el sistema vacío es ${fmtDecimal(result.P0, 4)}. ` +
                    `El tiempo promedio de espera en fila es ${fmtDecimal(result.Wq, 3)}.`}
                  {model === "finite-source" &&
                    `Con una población de ${poblacion} unidades, ${LAMBDA} = ${fmtDecimal(lambda, 2)} y ${MU} = ${fmtDecimal(mu, 2)}, ` +
                    `la probabilidad de que el sistema esté vacío es ${fmtDecimal(result.P0, 4)}. ` +
                    `En promedio, hay ${fmtDecimal(result.L, 2)} unidades en el sistema.`}
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
              {model === "single-server" &&
                `El sistema no es estable. Verifique que ${LAMBDA} < ${MU}.`}
              {model === "multi-server" &&
                `El sistema no es estable. Verifique que ${LAMBDA} < s \u00D7 ${MU}. La tasa de llegada debe ser menor que el producto de servidores por tasa de servicio.`}
              {model === "finite-source" &&
                `Verifique los parámetros del modelo de fuente finita. Asegúrese de que los valores de ${LAMBDA}, ${MU} y N sean válidos.`}
            </Typography>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
