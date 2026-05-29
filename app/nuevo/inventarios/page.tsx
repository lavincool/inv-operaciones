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
  Switch,
  Typography,
} from "@heroui/react";
import {
  RotateCcw,
  ArrowLeft,
  ShoppingCart,
  Factory,
  AlertTriangle,
  Percent,
  PieChart,
  Package,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Shield,
} from "lucide-react";
import Link from "next/link";
import {
  calculateCompra,
  calculateProduccion,
  calculateEscasez,
  calculateDescuentos,
  calculateProbabilistico,
  calcularCostoMantenimiento,
  type CompraOutput,
  type ProduccionOutput,
  type EscasezOutput,
  type DescuentosOutput,
  type ProbabilisticoOutput,
} from "@/lib/inv-operaciones";

type ModelType = "compra" | "produccion" | "escasez" | "descuentos" | "probabilistico";

const MODEL_LABELS: Record<ModelType, { title: string; desc: string; icon: React.ElementType; color: string }> = {
  compra: { title: "Compra Economica (EOQ)", desc: "Cantidad optima de pedido para minimizar costos de ordenar y mantener", icon: ShoppingCart, color: "text-accent" },
  produccion: { title: "Produccion Interna (EPQ)", desc: "Lote economico con reposicion gradual del inventario", icon: Factory, color: "text-success" },
  escasez: { title: "Con Escasez Permitida", desc: "Balance optimo permitiendo faltantes con costo de penalizacion", icon: AlertTriangle, color: "text-warning" },
  descuentos: { title: "Descuentos por Cantidad", desc: "Compara costo total con y sin descuento por volumen", icon: Percent, color: "text-warning" },
  probabilistico: { title: "Probabilistico", desc: "Stock de seguridad y punto de reorden con demanda variable", icon: PieChart, color: "text-danger" },
};

const MODELOS: ModelType[] = ["compra", "produccion", "escasez", "descuentos", "probabilistico"];

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
  return value.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

function fmtPercent(value: number): string {
  return value.toLocaleString("es-MX", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

/* ── Metric Card ────────────────────────────────────────────────────────── */

function MetricCard({ label, value, subtitle, icon: Icon, highlight, colorClass }: {
  label: string; value: string; subtitle?: string; icon: React.ElementType;
  highlight?: boolean; colorClass?: string;
}) {
  return (
    <Card variant="tertiary" className={highlight ? "ring-2 ring-accent/50 shadow-lg shadow-accent/5" : ""}>
      <Card.Header>
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${colorClass ?? "bg-accent/15 text-accent"}`}>
            <Icon className="size-4.5" />
          </div>
          <div>
            <Card.Title>{label}</Card.Title>
            {subtitle && <Card.Description>{subtitle}</Card.Description>}
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <Typography className="text-2xl font-bold tabular-nums" type="body">{value}</Typography>
      </Card.Content>
    </Card>
  );
}

/* ── Defaults per model ─────────────────────────────────────────────────── */

interface CompraDefaults {
  demandaAnual: number; costoPedido: number; costoMantenimiento: number; diasLaborales: number;
  costoUnitario: number; tasaMantenimiento: number; autoCalcH: boolean;
}

const DEFAULTS_COMPRA: CompraDefaults = {
  demandaAnual: 6000, costoPedido: 300, costoMantenimiento: 50, diasLaborales: 250,
  costoUnitario: 200, tasaMantenimiento: 25, autoCalcH: false,
};

const DEFAULTS_PRODUCCION = { demandaAnual: 6000, costoPreparacion: 300, costoMantenimiento: 50, tasaProduccion: 12000 };
const DEFAULTS_ESCASEZ = { demandaAnual: 6000, costoPedido: 300, costoMantenimiento: 50, costoEscasez: 80 };
const DEFAULTS_DESCUENTOS = { demandaAnual: 6000, costoPedido: 300, costoMantenimiento: 50, precioNivel1: 100, precioNivel2: 90, cantidadMinima: 500 };
const DEFAULTS_PROBABILISTICO = { demandaPromedio: 6000, varianza: 2500, valorZ: 1.65, costoPedido: 300, costoMantenimiento: 50, tiempoEntrega: 7 };

/* ════════════════════════════════════════════════════════════════════════════
 *  PAGINA PRINCIPAL
 * ════════════════════════════════════════════════════════════════════════════ */

export default function InventariosPageWrapper() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-20 text-center"><Typography color="muted" type="body">Cargando...</Typography></div>}>
      <InventariosPage />
    </Suspense>
  );
}

function InventariosPage() {
  const searchParams = useSearchParams();

  const modeloParam = searchParams.get("modelo");
  const initialModel: ModelType = modeloParam && MODELOS.includes(modeloParam as ModelType)
    ? modeloParam as ModelType
    : "compra";

  const num = (k: string) => {
    const v = searchParams.get(k);
    if (v === null) return undefined;
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  };

  const qDemandaAnual = num("demandaAnual");
  const qCostoPedido = num("costoPedido");
  const qCostoMantenimiento = num("costoMantenimiento");
  const qDiasLaborales = num("diasLaborales");
  const qCostoUnitario = num("costoUnitario");
  const qTasaMantenimiento = num("tasaMantenimiento");
  const qCostoPreparacion = num("costoPreparacion");
  const qTasaProduccion = num("tasaProduccion");
  const qCostoEscasez = num("costoEscasez");
  const qPrecioNivel1 = num("precioNivel1");
  const qPrecioNivel2 = num("precioNivel2");
  const qCantidadMinima = num("cantidadMinima");
  const qDemandaPromedio = num("demandaPromedio");
  const qVarianza = num("varianza");
  const qValorZ = num("valorZ");
  const qTiempoEntrega = num("tiempoEntrega");

  const hasAutoCalcH = qCostoUnitario !== undefined || qTasaMantenimiento !== undefined;

  const [model, setModel] = useState<ModelType>(initialModel);

  const [demandaAnual, setDemandaAnual] = useState(qDemandaAnual ?? DEFAULTS_COMPRA.demandaAnual);
  const [costoPedido, setCostoPedido] = useState(qCostoPedido ?? DEFAULTS_COMPRA.costoPedido);
  const [costoMantenimiento, setCostoMantenimiento] = useState(qCostoMantenimiento ?? DEFAULTS_COMPRA.costoMantenimiento);
  const [diasLaborales, setDiasLaborales] = useState(qDiasLaborales ?? DEFAULTS_COMPRA.diasLaborales);
  const [costoUnitario, setCostoUnitario] = useState(qCostoUnitario ?? DEFAULTS_COMPRA.costoUnitario);
  const [tasaMantenimiento, setTasaMantenimiento] = useState(qTasaMantenimiento ?? DEFAULTS_COMPRA.tasaMantenimiento);
  const [autoCalcH, setAutoCalcH] = useState(hasAutoCalcH || DEFAULTS_COMPRA.autoCalcH);

  const [prodDemanda, setProdDemanda] = useState(qDemandaAnual ?? DEFAULTS_PRODUCCION.demandaAnual);
  const [prodPreparacion, setProdPreparacion] = useState(qCostoPreparacion ?? DEFAULTS_PRODUCCION.costoPreparacion);
  const [prodMantenimiento, setProdMantenimiento] = useState(qCostoMantenimiento ?? DEFAULTS_PRODUCCION.costoMantenimiento);
  const [prodTasa, setProdTasa] = useState(qTasaProduccion ?? DEFAULTS_PRODUCCION.tasaProduccion);

  const [escDemanda, setEscDemanda] = useState(qDemandaAnual ?? DEFAULTS_ESCASEZ.demandaAnual);
  const [escPedido, setEscPedido] = useState(qCostoPedido ?? DEFAULTS_ESCASEZ.costoPedido);
  const [escMantenimiento, setEscMantenimiento] = useState(qCostoMantenimiento ?? DEFAULTS_ESCASEZ.costoMantenimiento);
  const [escEscasez, setEscEscasez] = useState(qCostoEscasez ?? DEFAULTS_ESCASEZ.costoEscasez);

  const [descDemanda, setDescDemanda] = useState(qDemandaAnual ?? DEFAULTS_DESCUENTOS.demandaAnual);
  const [descPedido, setDescPedido] = useState(qCostoPedido ?? DEFAULTS_DESCUENTOS.costoPedido);
  const [descMantenimiento, setDescMantenimiento] = useState(qCostoMantenimiento ?? DEFAULTS_DESCUENTOS.costoMantenimiento);
  const [descPrecio1, setDescPrecio1] = useState(qPrecioNivel1 ?? DEFAULTS_DESCUENTOS.precioNivel1);
  const [descPrecio2, setDescPrecio2] = useState(qPrecioNivel2 ?? DEFAULTS_DESCUENTOS.precioNivel2);
  const [descQmin, setDescQmin] = useState(qCantidadMinima ?? DEFAULTS_DESCUENTOS.cantidadMinima);

  const [probDemanda, setProbDemanda] = useState(qDemandaPromedio ?? DEFAULTS_PROBABILISTICO.demandaPromedio);
  const [probVarianza, setProbVarianza] = useState(qVarianza ?? DEFAULTS_PROBABILISTICO.varianza);
  const [probZ, setProbZ] = useState(qValorZ ?? DEFAULTS_PROBABILISTICO.valorZ);
  const [probPedido, setProbPedido] = useState(qCostoPedido ?? DEFAULTS_PROBABILISTICO.costoPedido);
  const [probMantenimiento, setProbMantenimiento] = useState(qCostoMantenimiento ?? DEFAULTS_PROBABILISTICO.costoMantenimiento);
  const [probLeadTime, setProbLeadTime] = useState(qTiempoEntrega ?? DEFAULTS_PROBABILISTICO.tiempoEntrega);

  /* ── Change model ────────────────────────────────────────────────────── */

  const handleChangeModel = useCallback((m: ModelType) => {
    setModel(m);
  }, []);

  /* ── Calculos ────────────────────────────────────────────────────────── */

  const compraResult: CompraOutput | null = useMemo(() => {
    if (model !== "compra") return null;
    const H = autoCalcH ? calcularCostoMantenimiento(costoUnitario, tasaMantenimiento) : costoMantenimiento;
    try { return calculateCompra({ demandaAnual, costoPedido, costoMantenimiento: H, diasLaborales }); } catch { return null; }
  }, [model, demandaAnual, costoPedido, costoMantenimiento, diasLaborales, costoUnitario, tasaMantenimiento, autoCalcH]);

  const prodResult: ProduccionOutput | null = useMemo(() => {
    if (model !== "produccion") return null;
    try { return calculateProduccion({ demandaAnual: prodDemanda, costoPreparacion: prodPreparacion, costoMantenimiento: prodMantenimiento, tasaProduccion: prodTasa }); } catch { return null; }
  }, [model, prodDemanda, prodPreparacion, prodMantenimiento, prodTasa]);

  const escResult: EscasezOutput | null = useMemo(() => {
    if (model !== "escasez") return null;
    try { return calculateEscasez({ demandaAnual: escDemanda, costoPedido: escPedido, costoMantenimiento: escMantenimiento, costoEscasez: escEscasez }); } catch { return null; }
  }, [model, escDemanda, escPedido, escMantenimiento, escEscasez]);

  const descResult: DescuentosOutput | null = useMemo(() => {
    if (model !== "descuentos") return null;
    try { return calculateDescuentos({ demandaAnual: descDemanda, costoPedido: descPedido, costoMantenimiento: descMantenimiento, precioNivel1: descPrecio1, precioNivel2: descPrecio2, cantidadMinima: descQmin }); } catch { return null; }
  }, [model, descDemanda, descPedido, descMantenimiento, descPrecio1, descPrecio2, descQmin]);

  const probResult: ProbabilisticoOutput | null = useMemo(() => {
    if (model !== "probabilistico") return null;
    try { return calculateProbabilistico({ demandaPromedio: probDemanda, varianza: probVarianza, valorZ: probZ, costoPedido: probPedido, costoMantenimiento: probMantenimiento, tiempoEntrega: probLeadTime }); } catch { return null; }
  }, [model, probDemanda, probVarianza, probZ, probPedido, probMantenimiento, probLeadTime]);

  /* ── Reset handlers ──────────────────────────────────────────────────── */

  const isCompraDefault = demandaAnual === DEFAULTS_COMPRA.demandaAnual && costoPedido === DEFAULTS_COMPRA.costoPedido && costoMantenimiento === DEFAULTS_COMPRA.costoMantenimiento && diasLaborales === DEFAULTS_COMPRA.diasLaborales && costoUnitario === DEFAULTS_COMPRA.costoUnitario && tasaMantenimiento === DEFAULTS_COMPRA.tasaMantenimiento && autoCalcH === DEFAULTS_COMPRA.autoCalcH;

  const Hdisplay = autoCalcH ? calcularCostoMantenimiento(costoUnitario, tasaMantenimiento) : costoMantenimiento;

  const handleResetCompra = useCallback(() => {
    setDemandaAnual(DEFAULTS_COMPRA.demandaAnual); setCostoPedido(DEFAULTS_COMPRA.costoPedido);
    setCostoMantenimiento(DEFAULTS_COMPRA.costoMantenimiento); setDiasLaborales(DEFAULTS_COMPRA.diasLaborales);
    setCostoUnitario(DEFAULTS_COMPRA.costoUnitario); setTasaMantenimiento(DEFAULTS_COMPRA.tasaMantenimiento);
    setAutoCalcH(DEFAULTS_COMPRA.autoCalcH);
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground" href="/nuevo">
          <ArrowLeft className="size-3.5" /><span>Sistema de Modelos</span>
        </Link>
        <Typography type="h1">Modelos de Inventarios</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Cinco modelos clasicos de gestion de inventarios con formulas originales
        </Typography>
      </div>

      {/* Model Selector */}
      <Card className="mb-8">
        <Card.Content className="py-4">
          <div className="flex flex-wrap gap-2">
            {MODELOS.map((m) => {
              const info = MODEL_LABELS[m];
              const isActive = model === m;
              return (
                <Button key={m} className="flex items-center gap-2" size="sm"
                  variant={isActive ? "primary" : "tertiary"} onPress={() => handleChangeModel(m)}>
                  <info.icon className="size-3.5" />{info.title}
                </Button>
              );
            })}
          </div>
          <Typography className="mt-3 text-xs" color="muted" type="body-sm">{MODEL_LABELS[model].desc}</Typography>
        </Card.Content>
      </Card>

      {/* ============================================= */}
      {/* MODELO: COMPRA (EOQ)                          */}
      {/* ============================================= */}
      {model === "compra" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div>
                  <Card.Title>Parametros del Sistema</Card.Title>
                  <Card.Description>Ajuste los valores para calcular la cantidad optima de pedido</Card.Description>
                </div>
                <Button isDisabled={isCompraDefault} size="sm" variant="tertiary" onPress={handleResetCompra}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label="D — Demanda Anual" maxValue={10000000} step={100} value={demandaAnual} onChange={setDemandaAnual} />
                  <ParamField label="S — Costo de Pedido" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={costoPedido} onChange={setCostoPedido} />
                  <ParamField label="Dias Laborales" maxValue={365} minValue={1} step={1} value={diasLaborales} onChange={setDiasLaborales} />
                  {!autoCalcH && (
                    <ParamField label="H — Costo de Mantenimiento" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={costoMantenimiento} onChange={setCostoMantenimiento} />
                  )}
                </div>

                <div className="rounded-lg border border-default-200 bg-default-50 p-4">
                  <div className="flex items-center justify-between">
                    <Typography className="text-sm font-medium" type="body">Calcular H automaticamente</Typography>
                    <Switch isSelected={autoCalcH} onChange={(v) => setAutoCalcH(v)} />
                  </div>
                  {autoCalcH && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ParamField label="C — Costo Unitario" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={costoUnitario} onChange={setCostoUnitario} />
                      <ParamField label="I — Tasa de Mantenimiento (%)" formatOptions={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }} maxValue={1} minValue={0} step={0.005} value={tasaMantenimiento / 100} onChange={(v) => setTasaMantenimiento(v * 100)} />
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-default-200 bg-default-50 p-3">
                  <Typography className="text-xs" color="muted" type="body-sm">
                    {autoCalcH
                      ? `H = C × (I / 100) = ${fmtCurrency(costoUnitario)} × (${fmtDecimal(tasaMantenimiento, 1)}% / 100) = ${fmtCurrency(Hdisplay)}`
                      : `H = ${fmtCurrency(costoMantenimiento)} (Costo de mantener una unidad durante un año)`}
                  </Typography>
                </div>
              </div>
            </Card.Content>
          </Card>

          {compraResult && (
            <>
              <Typography type="h2" className="mb-4">Resultados</Typography>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard label="Cantidad Optima (Q)" value={`${fmtDecimal(compraResult.q)} unidades`} subtitle="Tamano del lote a pedir" icon={Package} highlight colorClass="bg-accent/15 text-accent" />
                <MetricCard label="Costo Total Anual (CTA)" value={fmtCurrency(compraResult.cta)} subtitle="Costo de ordenar + mantener" icon={TrendingUp} highlight colorClass="bg-success/15 text-success" />
                <MetricCard label="Costo Total Unitario (CTU)" value={fmtCurrency(compraResult.ctu)} subtitle="CTA dividido entre la demanda" icon={DollarSign} colorClass="bg-default-100 text-muted" />
                <MetricCard label="Demanda Diaria (d)" value={`${fmtDecimal(compraResult.demandaDiaria)} unid/dia`} subtitle={`D / ${diasLaborales} dias laborales`} icon={CalendarDays} colorClass="bg-default-100 text-muted" />
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title><Card.Description>Sustitucion paso a paso en notacion matematica</Card.Description></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Cantidad Optima de Pedido (Q)" latex={compraResult.desgloses.Q} />
                    <Separator />
                    <PasoDesglose label="Costo Total Anual (CTA)" latex={compraResult.desgloses.CTA} />
                    <Separator />
                    <PasoDesglose label="Costo Total Unitario (CTU)" latex={compraResult.desgloses.CTU} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!compraResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">Verifique que todos los parametros sean validos (D, S y H mayores a cero, dias laborales entre 1 y 365).</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: PRODUCCION                            */}
      {/* ============================================= */}
      {model === "produccion" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros de Produccion</Card.Title><Card.Description>La tasa de produccion (a) debe ser mayor que la demanda (D)</Card.Description></div>
                <Button isDisabled={prodDemanda === DEFAULTS_PRODUCCION.demandaAnual && prodPreparacion === DEFAULTS_PRODUCCION.costoPreparacion && prodMantenimiento === DEFAULTS_PRODUCCION.costoMantenimiento && prodTasa === DEFAULTS_PRODUCCION.tasaProduccion} size="sm" variant="tertiary" onPress={() => { setProdDemanda(DEFAULTS_PRODUCCION.demandaAnual); setProdPreparacion(DEFAULTS_PRODUCCION.costoPreparacion); setProdMantenimiento(DEFAULTS_PRODUCCION.costoMantenimiento); setProdTasa(DEFAULTS_PRODUCCION.tasaProduccion); }}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ParamField label="D — Demanda Anual" maxValue={10000000} step={100} value={prodDemanda} onChange={setProdDemanda} />
                <ParamField label="S — Costo de Preparacion" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={prodPreparacion} onChange={setProdPreparacion} />
                <ParamField label="H — Costo de Mantenimiento" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={prodMantenimiento} onChange={setProdMantenimiento} />
                <ParamField label="a — Tasa de Produccion Anual" maxValue={10000000} step={100} value={prodTasa} onChange={setProdTasa} />
              </div>
              <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Condicion:</strong> La tasa de produccion (a) debe ser mayor que la demanda (D). Actualmente: {prodTasa} {prodTasa <= prodDemanda ? "≤" : ">"} {prodDemanda}
                </Typography>
              </div>
            </Card.Content>
          </Card>

          {prodResult && (
            <>
              <Typography type="h2" className="mb-4">Resultados</Typography>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard label="Lote de Produccion (Q)" value={`${fmtDecimal(prodResult.q)} unidades`} subtitle="Cantidad optima por corrida" icon={Package} highlight colorClass="bg-accent/15 text-accent" />
                <MetricCard label="Inventario Maximo (Sm)" value={`${fmtDecimal(prodResult.sm)} unidades`} subtitle="Q × (1 − D/a)" icon={TrendingUp} colorClass="bg-success/15 text-success" />
                <MetricCard label="Costo Total Anual (CTA)" value={fmtCurrency(prodResult.cta)} subtitle="Preparacion + mantenimiento" icon={DollarSign} highlight colorClass="bg-success/15 text-success" />
                <MetricCard label="Corridas por Ano (N)" value={`${fmtDecimal(prodResult.n)} corridas`} subtitle="D / Q" icon={Factory} colorClass="bg-default-100 text-muted" />
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Lote de Produccion (Q)" latex={prodResult.desgloses.Q} />
                    <Separator />
                    <PasoDesglose label="Inventario Maximo (Sm)" latex={prodResult.desgloses.Sm} />
                    <Separator />
                    <PasoDesglose label="Costo Total Anual (CTA)" latex={prodResult.desgloses.CTA} />
                    <Separator />
                    <PasoDesglose label="Corridas por Ano (N)" latex={prodResult.desgloses.N} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!prodResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">Verifique que la tasa de produccion (a) sea mayor que la demanda (D) y que todos los parametros sean positivos.</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: ESCASEZ                               */}
      {/* ============================================= */}
      {model === "escasez" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros del Sistema</Card.Title><Card.Description>Modelo que permite faltantes con costo de penalizacion por escasez</Card.Description></div>
                <Button isDisabled={escDemanda === DEFAULTS_ESCASEZ.demandaAnual && escPedido === DEFAULTS_ESCASEZ.costoPedido && escMantenimiento === DEFAULTS_ESCASEZ.costoMantenimiento && escEscasez === DEFAULTS_ESCASEZ.costoEscasez} size="sm" variant="tertiary" onPress={() => { setEscDemanda(DEFAULTS_ESCASEZ.demandaAnual); setEscPedido(DEFAULTS_ESCASEZ.costoPedido); setEscMantenimiento(DEFAULTS_ESCASEZ.costoMantenimiento); setEscEscasez(DEFAULTS_ESCASEZ.costoEscasez); }}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ParamField label="D — Demanda Anual" maxValue={10000000} step={100} value={escDemanda} onChange={setEscDemanda} />
                <ParamField label="S — Costo de Pedido" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={escPedido} onChange={setEscPedido} />
                <ParamField label="H — Costo de Mantenimiento" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={escMantenimiento} onChange={setEscMantenimiento} />
                <ParamField label="Ca — Costo de Escasez" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={escEscasez} onChange={setEscEscasez} />
              </div>
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Recomendacion:</strong> Use este modelo cuando el costo de escasez sea menor que el costo de mantenimiento.
                </Typography>
              </div>
            </Card.Content>
          </Card>

          {escResult && (
            <>
              <Typography type="h2" className="mb-4">Resultados</Typography>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard label="Lote con Escasez (Q)" value={`${fmtDecimal(escResult.q)} unidades`} subtitle="Cantidad optima del pedido" icon={Package} highlight colorClass="bg-accent/15 text-accent" />
                <MetricCard label="Inventario Maximo (Sm)" value={`${fmtDecimal(escResult.sm)} unidades`} subtitle="Nivel maximo sin faltante" icon={TrendingUp} colorClass="bg-warning/15 text-warning" />
                <MetricCard label="Faltante Maximo" value={`${fmtDecimal(escResult.faltante)} unidades`} subtitle="Q − Sm" icon={AlertTriangle} colorClass="bg-danger/15 text-danger" />
                <MetricCard label="Costo Total Anual (CTA)" value={fmtCurrency(escResult.cta)} subtitle="Ordenar + mantener + penalizar" icon={DollarSign} highlight colorClass="bg-success/15 text-success" />
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Lote con Escasez (Q)" latex={escResult.desgloses.Q} />
                    <Separator />
                    <PasoDesglose label="Inventario Maximo (Sm)" latex={escResult.desgloses.Sm} />
                    <Separator />
                    <PasoDesglose label="Costo Total Anual (CTA)" latex={escResult.desgloses.CTA} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!escResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">Verifique que todos los parametros sean validos (D, S, H y Ca mayores a cero).</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: DESCUENTOS                            */}
      {/* ============================================= */}
      {model === "descuentos" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros del Sistema</Card.Title><Card.Description>Comparacion de costo total con y sin descuento por volumen</Card.Description></div>
                <Button isDisabled={descDemanda === DEFAULTS_DESCUENTOS.demandaAnual && descPedido === DEFAULTS_DESCUENTOS.costoPedido && descMantenimiento === DEFAULTS_DESCUENTOS.costoMantenimiento && descPrecio1 === DEFAULTS_DESCUENTOS.precioNivel1 && descPrecio2 === DEFAULTS_DESCUENTOS.precioNivel2 && descQmin === DEFAULTS_DESCUENTOS.cantidadMinima} size="sm" variant="tertiary" onPress={() => { setDescDemanda(DEFAULTS_DESCUENTOS.demandaAnual); setDescPedido(DEFAULTS_DESCUENTOS.costoPedido); setDescMantenimiento(DEFAULTS_DESCUENTOS.costoMantenimiento); setDescPrecio1(DEFAULTS_DESCUENTOS.precioNivel1); setDescPrecio2(DEFAULTS_DESCUENTOS.precioNivel2); setDescQmin(DEFAULTS_DESCUENTOS.cantidadMinima); }}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div>
                  <Typography className="mb-3 text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">Parametros Basicos</Typography>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <ParamField label="D — Demanda Anual" maxValue={10000000} step={100} value={descDemanda} onChange={setDescDemanda} />
                    <ParamField label="S — Costo de Pedido" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={descPedido} onChange={setDescPedido} />
                    <ParamField label="H — Costo de Mantenimiento" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={descMantenimiento} onChange={setDescMantenimiento} />
                  </div>
                </div>
                <Separator />
                <div>
                  <Typography className="mb-3 text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">Precios y Descuentos</Typography>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <ParamField label="C1 — Precio Nivel 1 (sin descuento)" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={descPrecio1} onChange={setDescPrecio1} />
                    <ParamField label="C2 — Precio Nivel 2 (con descuento)" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={descPrecio2} onChange={setDescPrecio2} />
                    <ParamField label="Qmin — Cantidad Minima para descuento" maxValue={1000000} step={10} value={descQmin} onChange={setDescQmin} />
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {descResult && (
            <>
              <div className="mb-6">
                <Typography type="h2">Resultados y Decision</Typography>
                <Typography className="mt-1" color="muted" type="body-sm">Comparacion de costo total para determinar la mejor opcion</Typography>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card variant="tertiary" className="text-center">
                  <Card.Content className="py-4">
                    <Typography className="text-xs" color="muted" type="body-sm">Lote Economico Base</Typography>
                    <Typography className="mt-1 text-xl font-bold tabular-nums" type="body">{fmtDecimal(descResult.qBase)}</Typography>
                    <Typography className="text-xs" color="muted" type="body-sm">unidades</Typography>
                  </Card.Content>
                </Card>
                <Card variant="tertiary" className="text-center ring-2 ring-accent/50">
                  <Card.Content className="py-4">
                    <Typography className="text-xs" color="muted" type="body-sm">Costo Total SIN descuento</Typography>
                    <Typography className="mt-1 text-xl font-bold tabular-nums text-accent" type="body">{fmtCurrency(descResult.ctSin)}</Typography>
                    <Typography className="text-xs" color="muted" type="body-sm">pedir Q = {fmtDecimal(descResult.qBase)} a ${descPrecio1}</Typography>
                  </Card.Content>
                </Card>
                <Card variant="tertiary" className="text-center ring-2 ring-success/50">
                  <Card.Content className="py-4">
                    <Typography className="text-xs" color="muted" type="body-sm">Costo Total CON descuento</Typography>
                    <Typography className="mt-1 text-xl font-bold tabular-nums text-success" type="body">{fmtCurrency(descResult.ctCon)}</Typography>
                    <Typography className="text-xs" color="muted" type="body-sm">pedir Qmin = {descQmin} a ${descPrecio2}</Typography>
                  </Card.Content>
                </Card>
              </div>

              <Card className={`mb-8 ring-2 ${descResult.decision === "con_descuento" ? "ring-success/50" : "ring-accent/50"}`}>
                <Card.Content className="py-6 text-center">
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${descResult.decision === "con_descuento" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"}`}>
                    {descResult.decision === "con_descuento" ? "✓" : "✗"}
                    {descResult.decision === "con_descuento"
                      ? `CON descuento: Pedir ${descQmin} unidades a $${descPrecio2} c/u`
                      : `SIN descuento: Pedir ${fmtDecimal(descResult.qBase, 0)} unidades a $${descPrecio1} c/u`}
                  </div>
                  <Typography className="mt-3 text-sm" color="muted" type="body">
                    Ahorro: <strong className={descResult.decision === "con_descuento" ? "text-success" : "text-accent"}>{fmtCurrency(descResult.ahorro)}</strong>
                  </Typography>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Lote Economico Base (Q)" latex={descResult.desgloses.Q} />
                    <Separator />
                    <PasoDesglose label="Costo Total SIN Descuento" latex={descResult.desgloses.CTSin} />
                    <Separator />
                    <PasoDesglose label="Costo Total CON Descuento" latex={descResult.desgloses.CTCon} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!descResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">Verifique que todos los parametros y precios sean validos.</Typography></Card.Content>
            </Card>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* MODELO: PROBABILISTICO                        */}
      {/* ============================================= */}
      {model === "probabilistico" && (
        <>
          <Card className="mb-8">
            <Card.Header>
              <div className="flex w-full items-center justify-between">
                <div><Card.Title>Parametros del Sistema</Card.Title><Card.Description>Modelo probabilistico con stock de seguridad y punto de reorden</Card.Description></div>
                <Button isDisabled={probDemanda === DEFAULTS_PROBABILISTICO.demandaPromedio && probVarianza === DEFAULTS_PROBABILISTICO.varianza && probZ === DEFAULTS_PROBABILISTICO.valorZ && probPedido === DEFAULTS_PROBABILISTICO.costoPedido && probMantenimiento === DEFAULTS_PROBABILISTICO.costoMantenimiento && probLeadTime === DEFAULTS_PROBABILISTICO.tiempoEntrega} size="sm" variant="tertiary" onPress={() => { setProbDemanda(DEFAULTS_PROBABILISTICO.demandaPromedio); setProbVarianza(DEFAULTS_PROBABILISTICO.varianza); setProbZ(DEFAULTS_PROBABILISTICO.valorZ); setProbPedido(DEFAULTS_PROBABILISTICO.costoPedido); setProbMantenimiento(DEFAULTS_PROBABILISTICO.costoMantenimiento); setProbLeadTime(DEFAULTS_PROBABILISTICO.tiempoEntrega); }}>
                  <RotateCcw className="size-3.5" />Restablecer
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ParamField label="μ — Demanda Promedio Anual" maxValue={10000000} step={100} value={probDemanda} onChange={setProbDemanda} />
                  <ParamField label="σ² — Varianza" maxValue={1000000} step={1} value={probVarianza} onChange={setProbVarianza} />
                  <ParamField label="Z — Valor Z (nivel de servicio)" formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 3 }} maxValue={5} step={0.01} value={probZ} onChange={setProbZ} />
                  <ParamField label="S — Costo de Pedido" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={probPedido} onChange={setProbPedido} />
                  <ParamField label="H — Costo de Mantenimiento" formatOptions={CURRENCY_FMT} maxValue={1000000} step={0.01} value={probMantenimiento} onChange={setProbMantenimiento} />
                  <ParamField label="L — Tiempo de Entrega (dias)" maxValue={365} minValue={0.1} step={0.5} value={probLeadTime} onChange={setProbLeadTime} />
                </div>

                <div className="rounded-lg border border-default-200 bg-default-50 p-3">
                  <Typography className="text-xs" color="muted" type="body-sm">
                    <strong>Valores Z comunes:</strong> 90% → Z=1.28 &middot; 95% → Z=1.65 &middot; 99% → Z=2.33
                  </Typography>
                </div>
              </div>
            </Card.Content>
          </Card>

          {probResult && (
            <>
              <Typography type="h2" className="mb-4">Resultados</Typography>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard label="Lote Economico (Q)" value={`${fmtDecimal(probResult.q)} unidades`} subtitle="Cantidad optima de pedido" icon={Package} highlight colorClass="bg-accent/15 text-accent" />
                <MetricCard label="Punto de Reorden (PR)" value={`${fmtDecimal(probResult.pr)} unidades`} subtitle="Nivel de inventario de alerta" icon={AlertTriangle} colorClass="bg-warning/15 text-warning" />
                <MetricCard label="Stock de Seguridad" value={`${fmtDecimal(probResult.stockSeguridad)} unidades`} subtitle="Z × σ_LT" icon={Shield} highlight colorClass="bg-success/15 text-success" />
                <MetricCard label="Demanda en Lead Time" value={`${fmtDecimal(probResult.demandaLeadTime)} unidades`} subtitle={`${fmtDecimal(probResult.demandaDiaria)} unid/dia × ${probLeadTime} dias`} icon={CalendarDays} colorClass="bg-default-100 text-muted" />
              </div>

              <Card>
                <Card.Header><Card.Title>Desglose de Calculos</Card.Title></Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    <PasoDesglose label="Lote Economico (Q)" latex={probResult.desgloses.Q} />
                    <Separator />
                    <PasoDesglose label="Punto de Reorden (PR)" latex={probResult.desgloses.PR} />
                    <Separator />
                    <PasoDesglose label="Stock de Seguridad (SS)" latex={probResult.desgloses.SS} />
                  </div>
                </Card.Content>
              </Card>
            </>
          )}
          {!probResult && (
            <Card className="border border-danger/30 bg-danger/5">
              <Card.Content className="py-8 text-center"><Typography color="muted" type="body">Verifique que todos los parametros sean validos (D, S, H y L mayores a cero, varianza no negativa).</Typography></Card.Content>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
