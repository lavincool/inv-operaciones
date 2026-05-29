"use client";

import { useMemo, useState, useCallback, useLayoutEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Gauge,
  Timer,
  Hash,
  Users,
  Server,
  Clock,
  InfinityIcon,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import {
  calculateMM1,
  calculateMC1,
  calculateMM1N,
  calculateMMS,
  type UnidadTiempo,
  type TipoEntrada,
  type UnitConfig,
  type MM1Output,
  type MC1Output,
  type MM1NOutput,
  type MMSOutput,
} from "@/lib/colas-operaciones";

type ModelType = "mm1" | "mc1" | "mm1n" | "mms";

const LAMBDA = "\u03BB";
const MU = "\u03BC";
const RHO = "\u03C1";
const P0 = "P\u2080";
const PN = "P\u2099";

const MODEL_INFO: Record<ModelType, { title: string; desc: string; icon: React.ElementType; color: string }> = {
  mm1: { title: "M/M/1 — Cola Simple", desc: "Un servidor, llegadas Poisson, servicio exponencial, capacidad infinita", icon: Gauge, color: "text-accent" },
  mc1: { title: "M/C/1 — Servicio Constante", desc: "Un servidor, llegadas Poisson, tiempo de servicio deterministico", icon: Timer, color: "text-warning" },
  mm1n: { title: "M/M/1/N — Capacidad Limitada", desc: "Un servidor con capacidad maxima N. Clientes rechazados al llenarse", icon: Hash, color: "text-success" },
  mms: { title: "M/M/S — Multiples Servidores", desc: "S servidores en paralelo, una sola fila, llegadas Poisson", icon: Users, color: "text-danger" },
};

const MODELOS: ModelType[] = ["mm1", "mc1", "mm1n", "mms"];

/* ── Formateo ───────────────────────────────────────────────────────────── */

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function fmtDecimal(value: number, decimals = 4): string {
  return value.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/* ── KaTeX ──────────────────────────────────────────────────────────────── */

function LatexFormula({ latex }: { latex: string }) {
  const [html, setHtml] = useState<string>("");
  useLayoutEffect(() => {
    let cancelled = false;
    import("katex").then((m) => m.default).then((katex) => {
      if (cancelled) return;
      setHtml(katex.renderToString(latex, { throwOnError: false, displayMode: true, output: "htmlAndMathml" }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [latex]);
  return <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: html }} />;
}

function PasoDesglose({ label, latex }: { label: string; latex: string }) {
  return (
    <div className="space-y-1.5">
      <Typography className="text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">{label}</Typography>
      <div className="rounded-lg border border-default-200 bg-default-50 p-3"><LatexFormula latex={latex} /></div>
    </div>
  );
}

/* ── ParamField ─────────────────────────────────────────────────────────── */

function ParamField({ label, value, minValue = 0, maxValue, step, formatOptions, onChange }: {
  label: string; value: number; minValue?: number; maxValue?: number; step: number;
  formatOptions?: Intl.NumberFormatOptions; onChange: (v: number) => void;
}) {
  return (
    <NumberField isRequired formatOptions={formatOptions} maxValue={maxValue} minValue={minValue} step={step} value={value} onChange={onChange}>
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}

/* ── Unit selector inline buttons ───────────────────────────────────────── */

function UnitSelector({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Typography className="text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">{label}</Typography>
      <div className="flex gap-1">
        {options.map((o) => (
          <Button key={o.value} size="sm" variant={value === o.value ? "primary" : "tertiary"} className="text-xs" onPress={() => onChange(o.value)}>
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ── Metric Chip ────────────────────────────────────────────────────────── */

function MetricChip({ label, value, type = "default" }: { label: string; value: string; type?: "default" | "success" | "warning" | "danger" }) {
  const colors: Record<string, { bg: string; border: string }> = {
    default: { bg: "bg-default-100", border: "border-default-200" },
    success: { bg: "bg-success/10", border: "border-success/20" },
    warning: { bg: "bg-warning/10", border: "border-warning/20" },
    danger: { bg: "bg-danger/10", border: "border-danger/20" },
  };
  const c = colors[type];
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${c.border} ${c.bg}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/* ── Defaults per model ─────────────────────────────────────────────────── */

const DEFAULT_UNITS: UnitConfig = { lambdaUnit: "minuto", muUnit: "minuto", lambdaType: "cliente_tiempo", muType: "cliente_tiempo" };

const DEFAULTS_MM1 = { lambda: 2, mu: 3, n: 2, cs: 100, ce: 50 };
const DEFAULTS_MC1 = { lambda: 2, mu: 3, cs: 100, ce: 50 };
const DEFAULTS_MM1N = { lambda: 2, mu: 3, capacidad: 10, cs: 100, ce: 50 };
const DEFAULTS_MMS = { lambda: 4, mu: 3, servidores: 2, n: 3, cs: 100, ce: 50 };

/* ════════════════════════════════════════════════════════════════════════════
 *  PAGINA PRINCIPAL
 * ════════════════════════════════════════════════════════════════════════════ */

export default function ColasPageWrapper() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-20 text-center"><Typography color="muted" type="body">Cargando...</Typography></div>}>
      <ColasPage />
    </Suspense>
  );
}

function ColasPage() {
  const searchParams = useSearchParams();

  const modeloParam = searchParams.get("modelo");
  const initialModel: ModelType = modeloParam && MODELOS.includes(modeloParam as ModelType)
    ? modeloParam as ModelType
    : "mm1";

  const num = (k: string) => {
    const v = searchParams.get(k);
    if (v === null) return undefined;
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  };

  const qLambda = num("lambda");
  const qMu = num("mu");
  const qN = num("n");
  const qCs = num("cs");
  const qCe = num("ce");
  const qCapacidad = num("capacidad");
  const qServidores = num("servidores");

  const [model, setModel] = useState<ModelType>(initialModel);

  const [lambdaUnit, setLambdaUnit] = useState<UnidadTiempo>(DEFAULT_UNITS.lambdaUnit);
  const [muUnit, setMuUnit] = useState<UnidadTiempo>(DEFAULT_UNITS.muUnit);
  const [lambdaType, setLambdaType] = useState<TipoEntrada>(DEFAULT_UNITS.lambdaType);
  const [muType, setMuType] = useState<TipoEntrada>(DEFAULT_UNITS.muType);

  const unitConfig: UnitConfig = { lambdaUnit, muUnit, lambdaType, muType };

  const [mm1Lambda, setMm1Lambda] = useState(qLambda ?? DEFAULTS_MM1.lambda);
  const [mm1Mu, setMm1Mu] = useState(qMu ?? DEFAULTS_MM1.mu);
  const [mm1N, setMm1N] = useState(qN ?? DEFAULTS_MM1.n);
  const [mm1Cs, setMm1Cs] = useState(qCs ?? DEFAULTS_MM1.cs);
  const [mm1Ce, setMm1Ce] = useState(qCe ?? DEFAULTS_MM1.ce);

  const [mc1Lambda, setMc1Lambda] = useState(qLambda ?? DEFAULTS_MC1.lambda);
  const [mc1Mu, setMc1Mu] = useState(qMu ?? DEFAULTS_MC1.mu);
  const [mc1Cs, setMc1Cs] = useState(qCs ?? DEFAULTS_MC1.cs);
  const [mc1Ce, setMc1Ce] = useState(qCe ?? DEFAULTS_MC1.ce);

  const [mm1nLambda, setMm1nLambda] = useState(qLambda ?? DEFAULTS_MM1N.lambda);
  const [mm1nMu, setMm1nMu] = useState(qMu ?? DEFAULTS_MM1N.mu);
  const [mm1nCapacidad, setMm1nCapacidad] = useState(qCapacidad ?? DEFAULTS_MM1N.capacidad);
  const [mm1nCs, setMm1nCs] = useState(qCs ?? DEFAULTS_MM1N.cs);
  const [mm1nCe, setMm1nCe] = useState(qCe ?? DEFAULTS_MM1N.ce);

  const [mmsLambda, setMmsLambda] = useState(qLambda ?? DEFAULTS_MMS.lambda);
  const [mmsMu, setMmsMu] = useState(qMu ?? DEFAULTS_MMS.mu);
  const [mmsServidores, setMmsServidores] = useState(qServidores ?? DEFAULTS_MMS.servidores);
  const [mmsN, setMmsN] = useState(qN ?? DEFAULTS_MMS.n);
  const [mmsCs, setMmsCs] = useState(qCs ?? DEFAULTS_MMS.cs);
  const [mmsCe, setMmsCe] = useState(qCe ?? DEFAULTS_MMS.ce);

  /* ── Change model ────────────────────────────────────────────────────── */

  const handleChangeModel = useCallback((m: ModelType) => {
    setModel(m);
  }, []);

  /* ── Calculos ────────────────────────────────────────────────────────── */

  const mm1Result: MM1Output | null = useMemo(() => {
    if (model !== "mm1") return null;
    try { return calculateMM1({ lambda: mm1Lambda, mu: mm1Mu, n: mm1N, cs: mm1Cs, ce: mm1Ce, unitConfig }); } catch { return null; }
  }, [model, mm1Lambda, mm1Mu, mm1N, mm1Cs, mm1Ce, unitConfig]);

  const mc1Result: MC1Output | null = useMemo(() => {
    if (model !== "mc1") return null;
    try { return calculateMC1({ lambda: mc1Lambda, mu: mc1Mu, cs: mc1Cs, ce: mc1Ce, unitConfig }); } catch { return null; }
  }, [model, mc1Lambda, mc1Mu, mc1Cs, mc1Ce, unitConfig]);

  const mm1nResult: MM1NOutput | null = useMemo(() => {
    if (model !== "mm1n") return null;
    try { return calculateMM1N({ lambda: mm1nLambda, mu: mm1nMu, capacidad: mm1nCapacidad, cs: mm1nCs, ce: mm1nCe, unitConfig }); } catch { return null; }
  }, [model, mm1nLambda, mm1nMu, mm1nCapacidad, mm1nCs, mm1nCe, unitConfig]);

  const mmsResult: MMSOutput | null = useMemo(() => {
    if (model !== "mms") return null;
    try { return calculateMMS({ lambda: mmsLambda, mu: mmsMu, servidores: mmsServidores, n: mmsN, cs: mmsCs, ce: mmsCe, unitConfig }); } catch { return null; }
  }, [model, mmsLambda, mmsMu, mmsServidores, mmsN, mmsCs, mmsCe, unitConfig]);

  /* ── Reset handlers ──────────────────────────────────────────────────── */

  const resetMM1 = useCallback(() => { setMm1Lambda(DEFAULTS_MM1.lambda); setMm1Mu(DEFAULTS_MM1.mu); setMm1N(DEFAULTS_MM1.n); setMm1Cs(DEFAULTS_MM1.cs); setMm1Ce(DEFAULTS_MM1.ce); }, []);
  const resetMC1 = useCallback(() => { setMc1Lambda(DEFAULTS_MC1.lambda); setMc1Mu(DEFAULTS_MC1.mu); setMc1Cs(DEFAULTS_MC1.cs); setMc1Ce(DEFAULTS_MC1.ce); }, []);
  const resetMM1N = useCallback(() => { setMm1nLambda(DEFAULTS_MM1N.lambda); setMm1nMu(DEFAULTS_MM1N.mu); setMm1nCapacidad(DEFAULTS_MM1N.capacidad); setMm1nCs(DEFAULTS_MM1N.cs); setMm1nCe(DEFAULTS_MM1N.ce); }, []);
  const resetMMS = useCallback(() => { setMmsLambda(DEFAULTS_MMS.lambda); setMmsMu(DEFAULTS_MMS.mu); setMmsServidores(DEFAULTS_MMS.servidores); setMmsN(DEFAULTS_MMS.n); setMmsCs(DEFAULTS_MMS.cs); setMmsCe(DEFAULTS_MMS.ce); }, []);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground" href="/nuevo">
          <ArrowLeft className="size-3.5" /><span>Sistema de Modelos</span>
        </Link>
        <Typography type="h1">Teoria de Colas</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Cuatro modelos de lineas de espera probabilisticas con formulas originales y conversion de unidades
        </Typography>
      </div>

      {/* Model Selector */}
      <Card className="mb-8">
        <Card.Content className="py-4">
          <div className="flex flex-wrap gap-2">
            {MODELOS.map((m) => {
              const info = MODEL_INFO[m];
              return (
                <Button key={m} className="flex items-center gap-2" size="sm"
                  variant={model === m ? "primary" : "tertiary"} onPress={() => handleChangeModel(m)}>
                  <info.icon className="size-3.5" />{info.title}
                </Button>
              );
            })}
          </div>
          <Typography className="mt-3 text-xs" color="muted" type="body-sm">{MODEL_INFO[model].desc}</Typography>
        </Card.Content>
      </Card>

      {/* ============================================= */}
      {/* MODELO: M/M/1                                 */}
      {/* ============================================= */}
      {model === "mm1" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros M/M/1</Card.Title><Card.Description>Un servidor, llegadas Poisson, servicio exponencial</Card.Description></div>
                <Button isDisabled={mm1Lambda === DEFAULTS_MM1.lambda && mm1Mu === DEFAULTS_MM1.mu && mm1N === DEFAULTS_MM1.n && mm1Cs === DEFAULTS_MM1.cs && mm1Ce === DEFAULTS_MM1.ce} size="sm" variant="tertiary" onPress={resetMM1}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label={`${LAMBDA} — Tasa de Llegada`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mm1Lambda} onChange={setMm1Lambda} />
                  <ParamField label={`${MU} — Tasa de Servicio`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mm1Mu} onChange={setMm1Mu} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <UnitSelector label={`Unidades de ${LAMBDA}`} value={lambdaUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setLambdaUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Unidades de ${MU}`} value={muUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setMuUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Tipo de entrada ${LAMBDA}`} value={lambdaType} options={[{ value: "cliente_tiempo", label: "Clientes / tiempo" }, { value: "tiempo_cliente", label: "Tiempo / cliente" }]} onChange={(v) => setLambdaType(v as TipoEntrada)} />
                  <UnitSelector label={`Tipo de entrada ${MU}`} value={muType} options={[{ value: "cliente_tiempo", label: "Clientes / tiempo" }, { value: "tiempo_cliente", label: "Tiempo / cliente" }]} onChange={(v) => setMuType(v as TipoEntrada)} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ParamField label={`n — Clientes para ${PN}`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} maxValue={100} step={1} value={mm1N} onChange={(v) => setMm1N(Math.round(v))} />
                  <ParamField label="cs — Costo Servicio ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mm1Cs} onChange={setMm1Cs} />
                  <ParamField label="ce — Costo Espera ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mm1Ce} onChange={setMm1Ce} />
                </div>

                {mm1Result && (
                  <div className="rounded-lg border border-default-200 bg-default-50 p-3">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      <strong>Valores convertidos:</strong> {LAMBDA}&prime; = {fmtDecimal(mm1Result.lambdaConv)} /h, {MU}&prime; = {fmtDecimal(mm1Result.muConv)} /h
                      &middot; <Chip color={mm1Result.P >= 1 ? "danger" : mm1Result.P >= 0.7 ? "warning" : "success"} size="sm" variant="soft">{RHO} = {fmtDecimal(mm1Result.P)}</Chip>
                    </Typography>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {mm1Result && (
            <>
              <Typography type="h2" className="mb-4">Resultados M/M/1</Typography>
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">{RHO} (Utilizacion)</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.P)}</Typography>
                  <Chip className="mt-2" color={mm1Result.P >= 1 ? "danger" : mm1Result.P >= 0.7 ? "warning" : "success"} size="sm" variant="soft">{mm1Result.P >= 0.7 ? "Alto" : "Estable"}</Chip>
                </Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">{P0} (Sistema Vacio)</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.P0)}</Typography>
                </Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">Lq (En Fila)</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.Lq)}</Typography>
                </Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">L (En Sistema)</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.L)}</Typography>
                </Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">Wq (Tiempo en Fila)</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.Wq)}</Typography>
                </Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">W (Tiempo en Sistema)</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.W)}</Typography>
                </Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4">
                  <Typography className="text-xs" color="muted" type="body-sm">{PN}(n={mm1N})</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1Result.Pn, 6)}</Typography>
                </Card.Content></Card>
                <Card className="text-center ring-2 ring-accent/50"><Card.Content className="py-4">
                  <Typography className="text-xs text-accent font-semibold" type="body-sm">Costo Total</Typography>
                  <Typography className="mt-1 text-xl font-bold tabular-nums text-accent" type="body">{fmtCurrency(mm1Result.CT)}</Typography>
                </Card.Content></Card>
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Utilizacion del Sistema (ρ)" latex={mm1Result.desgloses.P} />
                    <Separator />
                    <PasoDesglose label={`Probabilidad de ${mm1N} clientes (P${mm1N})`} latex={mm1Result.desgloses.Pn} />
                    <Separator />
                    <PasoDesglose label="Probabilidad Sistema Vacio (P0)" latex={mm1Result.desgloses.P0} />
                    <Separator />
                    <PasoDesglose label="Clientes en el Sistema (L)" latex={mm1Result.desgloses.L} />
                    <Separator />
                    <PasoDesglose label="Clientes en la Fila (Lq)" latex={mm1Result.desgloses.Lq} />
                    <Separator />
                    <PasoDesglose label="Tiempo en el Sistema (W)" latex={mm1Result.desgloses.W} />
                    <Separator />
                    <PasoDesglose label="Tiempo en la Fila (Wq)" latex={mm1Result.desgloses.Wq} />
                    <Separator />
                    <PasoDesglose label="Costo Total del Sistema (CT)" latex={mm1Result.desgloses.CT} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!mm1Result && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">El sistema no es estable. Verifique que {LAMBDA} &lt; {MU} despues de la conversion de unidades.</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: M/C/1                                 */}
      {/* ============================================= */}
      {model === "mc1" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros M/C/1</Card.Title><Card.Description>Servicio determinista (tiempo constante). {PN} no se calcula en este modelo.</Card.Description></div>
                <Button isDisabled={mc1Lambda === DEFAULTS_MC1.lambda && mc1Mu === DEFAULTS_MC1.mu && mc1Cs === DEFAULTS_MC1.cs && mc1Ce === DEFAULTS_MC1.ce} size="sm" variant="tertiary" onPress={resetMC1}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label={`${LAMBDA} — Tasa de Llegada`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mc1Lambda} onChange={setMc1Lambda} />
                  <ParamField label={`${MU} — Tasa de Servicio`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mc1Mu} onChange={setMc1Mu} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <UnitSelector label={`Unidades de ${LAMBDA}`} value={lambdaUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setLambdaUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Unidades de ${MU}`} value={muUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setMuUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Tipo de entrada ${LAMBDA}`} value={lambdaType} options={[{ value: "cliente_tiempo", label: "Clientes / tiempo" }, { value: "tiempo_cliente", label: "Tiempo / cliente" }]} onChange={(v) => setLambdaType(v as TipoEntrada)} />
                  <UnitSelector label={`Tipo de entrada ${MU}`} value={muType} options={[{ value: "cliente_tiempo", label: "Clientes / tiempo" }, { value: "tiempo_cliente", label: "Tiempo / cliente" }]} onChange={(v) => setMuType(v as TipoEntrada)} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label="cs — Costo Servicio ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mc1Cs} onChange={setMc1Cs} />
                  <ParamField label="ce — Costo Espera ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mc1Ce} onChange={setMc1Ce} />
                </div>

                {mc1Result && (
                  <div className="rounded-lg border border-default-200 bg-default-50 p-3">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      <strong>Valores convertidos:</strong> {LAMBDA}&prime; = {fmtDecimal(mc1Result.lambdaConv)} /h, {MU}&prime; = {fmtDecimal(mc1Result.muConv)} /h
                    </Typography>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {mc1Result && (
            <>
              <Typography type="h2" className="mb-4">Resultados M/C/1</Typography>
              <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Nota:</strong> En el modelo M/C/1, {PN} (probabilidad de n clientes) no se calcula directamente debido a la naturaleza determinista del servicio.
                </Typography>
              </div>
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{RHO} (Utilizacion)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mc1Result.P)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{P0} (Sistema Vacio)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mc1Result.P0)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">Lq (En Fila)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mc1Result.Lq)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">L (En Sistema)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mc1Result.L)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">Wq (Tiempo en Fila)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mc1Result.Wq)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">W (Tiempo en Sistema)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mc1Result.W)}</Typography></Card.Content></Card>
              </div>

              <Card className="mb-8 ring-2 ring-accent/50">
                <Card.Content className="py-6 text-center">
                  <Typography className="text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">Costo Total del Sistema</Typography>
                  <Typography className="mt-1 text-3xl font-bold tabular-nums text-accent" type="body">{fmtCurrency(mc1Result.CT)}</Typography>
                  <Typography className="text-xs" color="muted" type="body-sm">CT = cs + ce × Lq</Typography>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Utilizacion del Sistema (ρ)" latex={mc1Result.desgloses.P} />
                    <Separator />
                    <PasoDesglose label="Probabilidad Sistema Vacio (P0)" latex={mc1Result.desgloses.P0} />
                    <Separator />
                    <PasoDesglose label="Clientes en la Fila (Lq) — Formula M/C/1" latex={mc1Result.desgloses.Lq} />
                    <Separator />
                    <PasoDesglose label="Clientes en el Sistema (L)" latex={mc1Result.desgloses.L} />
                    <Separator />
                    <PasoDesglose label="Tiempo en la Fila (Wq)" latex={mc1Result.desgloses.Wq} />
                    <Separator />
                    <PasoDesglose label="Tiempo en el Sistema (W)" latex={mc1Result.desgloses.W} />
                    <Separator />
                    <PasoDesglose label="Costo Total (CT)" latex={mc1Result.desgloses.CT} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!mc1Result && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">El sistema no es estable o hay parametros invalidos. Verifique que {LAMBDA} &lt; {MU} despues de conversion.</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: M/M/1/N                               */}
      {/* ============================================= */}
      {model === "mm1n" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros M/M/1/N</Card.Title><Card.Description>Capacidad maxima N en el sistema. Clientes rechazados cuando el sistema esta lleno.</Card.Description></div>
                <Button isDisabled={mm1nLambda === DEFAULTS_MM1N.lambda && mm1nMu === DEFAULTS_MM1N.mu && mm1nCapacidad === DEFAULTS_MM1N.capacidad && mm1nCs === DEFAULTS_MM1N.cs && mm1nCe === DEFAULTS_MM1N.ce} size="sm" variant="tertiary" onPress={resetMM1N}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label={`${LAMBDA} — Tasa de Llegada`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mm1nLambda} onChange={setMm1nLambda} />
                  <ParamField label={`${MU} — Tasa de Servicio`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mm1nMu} onChange={setMm1nMu} />
                  <ParamField label="N — Capacidad Maxima" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} maxValue={100} minValue={1} step={1} value={mm1nCapacidad} onChange={(v) => setMm1nCapacidad(Math.round(v))} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <UnitSelector label={`Unidades de ${LAMBDA}`} value={lambdaUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setLambdaUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Unidades de ${MU}`} value={muUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setMuUnit(v as UnidadTiempo)} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label="cs — Costo Servicio ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mm1nCs} onChange={setMm1nCs} />
                  <ParamField label="ce — Costo Espera ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mm1nCe} onChange={setMm1nCe} />
                </div>
              </div>
            </Card.Content>
          </Card>

          {mm1nResult && (
            <>
              <Typography type="h2" className="mb-4">Resultados M/M/1/N</Typography>
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{RHO} (Utilizacion)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1nResult.P)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{P0} (Sistema Vacio)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1nResult.P0, 6)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">Lq (En Fila)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1nResult.Lq)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">L (En Sistema)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1nResult.L)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">Capacidad Utilizada</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mm1nResult.capacidadUtilizada, 1)}%</Typography></Card.Content></Card>
                <Card className="text-center ring-2 ring-accent/50"><Card.Content className="py-4"><Typography className="text-xs text-accent font-semibold" type="body-sm">Costo Total</Typography><Typography className="mt-1 text-xl font-bold tabular-nums text-accent" type="body">{fmtCurrency(mm1nResult.CT)}</Typography></Card.Content></Card>
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Utilizacion del Sistema (ρ)" latex={mm1nResult.desgloses.P} />
                    <Separator />
                    <PasoDesglose label="Probabilidad Sistema Vacio (P0)" latex={mm1nResult.desgloses.P0} />
                    <Separator />
                    <PasoDesglose label="Clientes en el Sistema (L)" latex={mm1nResult.desgloses.L} />
                    <Separator />
                    <PasoDesglose label="Clientes en la Fila (Lq)" latex={mm1nResult.desgloses.Lq} />
                    <Separator />
                    <PasoDesglose label="Tiempo en el Sistema (W)" latex={mm1nResult.desgloses.W} />
                    <Separator />
                    <PasoDesglose label="Tiempo en la Fila (Wq)" latex={mm1nResult.desgloses.Wq} />
                    <Separator />
                    <PasoDesglose label="Costo Total (CT)" latex={mm1nResult.desgloses.CT} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!mm1nResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">Verifique que λ, μ y N sean mayores a cero y que la capacidad sea un entero ≥ 1.</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: M/M/S                                 */}
      {/* ============================================= */}
      {model === "mms" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros M/M/S</Card.Title><Card.Description>Multiples servidores en paralelo, una fila comun, llegadas Poisson</Card.Description></div>
                <Button isDisabled={mmsLambda === DEFAULTS_MMS.lambda && mmsMu === DEFAULTS_MMS.mu && mmsServidores === DEFAULTS_MMS.servidores && mmsN === DEFAULTS_MMS.n && mmsCs === DEFAULTS_MMS.cs && mmsCe === DEFAULTS_MMS.ce} size="sm" variant="tertiary" onPress={resetMMS}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ParamField label={`${LAMBDA} — Tasa de Llegada`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mmsLambda} onChange={setMmsLambda} />
                  <ParamField label={`${MU} — Tasa de Servicio`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={1000} minValue={0.001} step={0.01} value={mmsMu} onChange={setMmsMu} />
                  <ParamField label="S — Numero de Servidores" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} maxValue={50} minValue={1} step={1} value={mmsServidores} onChange={(v) => setMmsServidores(Math.round(v))} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <UnitSelector label={`Unidades de ${LAMBDA}`} value={lambdaUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setLambdaUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Unidades de ${MU}`} value={muUnit} options={[{ value: "minuto", label: "Minutos" }, { value: "hora", label: "Horas" }]} onChange={(v) => setMuUnit(v as UnidadTiempo)} />
                  <UnitSelector label={`Tipo de entrada ${LAMBDA}`} value={lambdaType} options={[{ value: "cliente_tiempo", label: "Clientes / tiempo" }, { value: "tiempo_cliente", label: "Tiempo / cliente" }]} onChange={(v) => setLambdaType(v as TipoEntrada)} />
                  <UnitSelector label={`Tipo de entrada ${MU}`} value={muType} options={[{ value: "cliente_tiempo", label: "Clientes / tiempo" }, { value: "tiempo_cliente", label: "Tiempo / cliente" }]} onChange={(v) => setMuType(v as TipoEntrada)} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ParamField label={`n — Clientes para ${PN}`} formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} maxValue={100} step={1} value={mmsN} onChange={(v) => setMmsN(Math.round(v))} />
                  <ParamField label="cs — Costo Servicio ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mmsCs} onChange={setMmsCs} />
                  <ParamField label="ce — Costo Espera ($/h)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }} maxValue={100000} step={1} value={mmsCe} onChange={setMmsCe} />
                </div>

                {mmsResult && (
                  <div className="rounded-lg border border-default-200 bg-default-50 p-3">
                    <Typography className="text-xs" color="muted" type="body-sm">
                      <strong>Valores convertidos:</strong> {LAMBDA}&prime; = {fmtDecimal(mmsResult.lambdaConv)} /h, {MU}&prime; = {fmtDecimal(mmsResult.muConv)} /h
                      &middot; Estabilidad: {LAMBDA}&prime; = {fmtDecimal(mmsResult.lambdaConv)} {mmsResult.lambdaConv < mmsServidores * mmsResult.muConv ? "<" : "≥"} S·{MU}&prime; = {mmsServidores}·{fmtDecimal(mmsResult.muConv)} = {fmtDecimal(mmsServidores * mmsResult.muConv)}
                    </Typography>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {mmsResult && (
            <>
              <Typography type="h2" className="mb-4">Resultados M/M/S</Typography>
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{RHO} (Utilizacion)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.P)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{P0} (Sistema Vacio)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.P0, 6)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">Lq (En Fila)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.Lq)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">L (En Sistema)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.L)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">Wq (Tiempo en Fila)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.Wq)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">W (Tiempo en Sistema)</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.W)}</Typography></Card.Content></Card>
                <Card className="text-center"><Card.Content className="py-4"><Typography className="text-xs" color="muted" type="body-sm">{PN}(n={mmsN})</Typography><Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(mmsResult.Pn, 6)}</Typography></Card.Content></Card>
                <Card className="text-center ring-2 ring-accent/50"><Card.Content className="py-4"><Typography className="text-xs text-accent font-semibold" type="body-sm">Costo Total</Typography><Typography className="mt-1 text-xl font-bold tabular-nums text-accent" type="body">{fmtCurrency(mmsResult.CT)}</Typography></Card.Content></Card>
              </div>

              <div className="mb-8 rounded-lg border border-default-200 bg-default-50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-muted" />
                  <div>
                    <Typography className="text-sm font-medium" type="body">Servidores Activos Promedio</Typography>
                    <Typography className="text-2xl font-bold tabular-nums" type="body">
                      {fmtDecimal(mmsResult.servidoresActivos, 1)} <span className="text-sm font-normal text-muted">de {mmsServidores}</span>
                    </Typography>
                  </div>
                </div>
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Utilizacion del Sistema (ρ)" latex={mmsResult.desgloses.P} />
                    <Separator />
                    <PasoDesglose label={`Probabilidad de ${mmsN} clientes (P${mmsN})`} latex={mmsResult.desgloses.Pn} />
                    <Separator />
                    <PasoDesglose label="Probabilidad Sistema Vacio (P0)" latex={mmsResult.desgloses.P0} />
                    <Separator />
                    <PasoDesglose label="Clientes en el Sistema (L)" latex={mmsResult.desgloses.L} />
                    <Separator />
                    <PasoDesglose label="Clientes en la Fila (Lq)" latex={mmsResult.desgloses.Lq} />
                    <Separator />
                    <PasoDesglose label="Tiempo en el Sistema (W)" latex={mmsResult.desgloses.W} />
                    <Separator />
                    <PasoDesglose label="Tiempo en la Fila (Wq)" latex={mmsResult.desgloses.Wq} />
                    <Separator />
                    <PasoDesglose label="Costo Total (CT)" latex={mmsResult.desgloses.CT} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!mmsResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">El sistema no es estable. Verifique que {LAMBDA} &lt; S·{MU} y que todos los parametros sean validos.</Typography></Card.Content>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
