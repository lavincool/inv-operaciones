"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
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
import { RotateCcw, ArrowLeft, ShoppingCart, Factory, TrendingDown, Award, CalendarDays } from "lucide-react";
import Link from "next/link";
import {
  calculateMakeBuy,
  type MakeBuyInput,
  type MakeBuyOutput,
  type Periodo,
} from "@/lib/make-buy";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (caso de prueba)                              */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  demandaTotalMensual: number;
  porcentajeCompra: number;
  porcentajeFabricacion: number;
  costoPedidoCompra: number;
  costoUnitarioCompra: number;
  costoPreparacionFab: number;
  costoUnitarioFab: number;
  tasaMantenimientoAnual: number;
  capacidadProduccionMensual: number;
  periodo: Periodo;
}

const DEFAULT_PARAMS: DefaultParams = {
  demandaTotalMensual: 60000,
  porcentajeCompra: 0.5,
  porcentajeFabricacion: 0.5,
  costoPedidoCompra: 35,
  costoUnitarioCompra: 34.8,
  costoPreparacionFab: 50,
  costoUnitarioFab: 30,
  tasaMantenimientoAnual: 0.15,
  capacidadProduccionMensual: 150000,
  periodo: "anual",
};

/* ------------------------------------------------------------------ */
/*  Formateo                                                          */
/* ------------------------------------------------------------------ */

const CURRENCY_FMT: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const PERCENT_FMT: Intl.NumberFormatOptions = {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
};

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", CURRENCY_FMT).format(value);
}

function fmtDecimal(value: number, decimals = 2): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPercent(value: number): string {
  return value.toLocaleString("es-MX", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

/* ------------------------------------------------------------------ */
/*  Renderizado de LaTeX con KaTeX                                    */
/* ------------------------------------------------------------------ */

function LatexFormula({ latex }: { latex: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      Promise.resolve().then(async () => {
        const katex = (await import("katex")).default;
        if (containerRef.current) {
          katex.render(latex, containerRef.current, {
            throwOnError: false,
            displayMode: true,
            output: "htmlAndMathml",
          });
        }
      });
    } catch {
      // Silently fail for malformed LaTeX
    }
  }, [latex]);

  return <div ref={containerRef} className="overflow-x-auto py-1" />;
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
/*  Tarjeta de resultado con desglose                                 */
/* ------------------------------------------------------------------ */

interface ResultadoCardProps {
  titulo: string;
  subtitulo: string;
  icono: React.ElementType;
  Q_optima: number;
  qLabel: string;
  CTA: number;
  ctaLabel: string;
  desglose_D: string;
  desglose_H: string;
  desglose_factor?: string;
  desglose_Q: string;
  desglose_CTA: string;
  operacionesPorPeriodo: number;
  opsLabel: string;
  esGanador: boolean;
}

function ResultadoCard({
  titulo,
  subtitulo,
  icono: Icon,
  Q_optima,
  qLabel,
  CTA,
  ctaLabel,
  desglose_D,
  desglose_H,
  desglose_factor,
  desglose_Q,
  desglose_CTA,
  operacionesPorPeriodo,
  opsLabel,
  esGanador,
}: ResultadoCardProps) {
  return (
    <Card
      className={`flex-1 ${esGanador ? "ring-2 ring-success/50 shadow-lg shadow-success/10" : ""}`}
      variant="tertiary"
    >
      <Card.Header>
        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${esGanador ? "bg-success/15 text-success" : "bg-default-100 text-muted"
              }`}
          >
            <Icon className="size-4.5" />
          </div>
          <div>
            <Card.Title>{titulo}</Card.Title>
            <Card.Description>{subtitulo}</Card.Description>
          </div>
        </div>
        {esGanador && (
          <Chip color="success" variant="primary" size="sm">
            <Award className="mr-1 size-3" />
            Mejor Opcion
          </Chip>
        )}
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div>
            <Typography
              className="text-xs font-semibold uppercase tracking-wider"
              color="muted"
              type="body-sm"
            >
              {qLabel}
            </Typography>
            <Typography className="mt-1 text-2xl font-bold tabular-nums" type="body">
              {fmtDecimal(Q_optima, 2)} unidades
            </Typography>
          </div>

          <Separator />

          <div>
            <Typography
              className="text-xs font-semibold uppercase tracking-wider"
              color="muted"
              type="body-sm"
            >
              {ctaLabel}
            </Typography>
            <Typography
              className={`mt-1 text-2xl font-bold tabular-nums ${esGanador ? "text-success" : ""}`}
              type="body"
            >
              {fmtCurrency(CTA)}
            </Typography>
          </div>

          <Separator />

          <div>
            <Typography
              className="text-xs font-semibold uppercase tracking-wider"
              color="muted"
              type="body-sm"
            >
              {opsLabel}
            </Typography>
            <Typography className="mt-1 text-lg font-semibold tabular-nums" type="body">
              {fmtDecimal(operacionesPorPeriodo, 2)}
            </Typography>
          </div>

          <Separator />

          <Typography
            className="text-xs font-semibold uppercase tracking-wider"
            color="muted"
            type="body-sm"
          >
            Desglose del Calculo
          </Typography>

          <PasoDesglose label="Demanda" latex={desglose_D} />
          <PasoDesglose label="Costo de Mantenimiento (H)" latex={desglose_H} />
          {desglose_factor && (
            <PasoDesglose label="Factor de Produccion (1 - d/p)" latex={desglose_factor} />
          )}
          <PasoDesglose label="Lote Optimo (Q*)" latex={desglose_Q} />
          <PasoDesglose label="Costo Total" latex={desglose_CTA} />
        </div>
      </Card.Content>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagina principal                                                  */
/* ------------------------------------------------------------------ */

export default function MakeBuyPage() {
  /* ---- estado ---- */
  const [demandaTotalMensual, setDemandaTotalMensual] = useState(
    DEFAULT_PARAMS.demandaTotalMensual,
  );
  const [porcentajeCompra, setPorcentajeCompra] = useState(DEFAULT_PARAMS.porcentajeCompra);
  const [porcentajeFabricacion, setPorcentajeFabricacion] = useState(
    DEFAULT_PARAMS.porcentajeFabricacion,
  );
  const [costoPedidoCompra, setCostoPedidoCompra] = useState(
    DEFAULT_PARAMS.costoPedidoCompra,
  );
  const [costoUnitarioCompra, setCostoUnitarioCompra] = useState(
    DEFAULT_PARAMS.costoUnitarioCompra,
  );
  const [costoPreparacionFab, setCostoPreparacionFab] = useState(
    DEFAULT_PARAMS.costoPreparacionFab,
  );
  const [costoUnitarioFab, setCostoUnitarioFab] = useState(DEFAULT_PARAMS.costoUnitarioFab);
  const [tasaMantenimientoAnual, setTasaMantenimientoAnual] = useState(
    DEFAULT_PARAMS.tasaMantenimientoAnual,
  );
  const [capacidadProduccionMensual, setCapacidadProduccionMensual] = useState(
    DEFAULT_PARAMS.capacidadProduccionMensual,
  );
  const [periodo, setPeriodo] = useState<Periodo>(DEFAULT_PARAMS.periodo);

  const esAnual = periodo === "anual";

  /* ---- calculos ---- */
  const input: MakeBuyInput = useMemo(
    () => ({
      demandaTotalMensual,
      porcentajeCompra,
      porcentajeFabricacion,
      costoPedidoCompra,
      costoUnitarioCompra,
      costoPreparacionFab,
      costoUnitarioFab,
      tasaMantenimientoAnual,
      capacidadProduccionMensual,
      periodo,
    }),
    [
      demandaTotalMensual,
      porcentajeCompra,
      porcentajeFabricacion,
      costoPedidoCompra,
      costoUnitarioCompra,
      costoPreparacionFab,
      costoUnitarioFab,
      tasaMantenimientoAnual,
      capacidadProduccionMensual,
      periodo,
    ],
  );

  const result: MakeBuyOutput | null = useMemo(() => {
    try {
      return calculateMakeBuy(input);
    } catch {
      return null;
    }
  }, [input]);

  /* ---- labels dinamicos ---- */
  const costoLabel = esAnual ? "Costo Total Anual" : "Costo Total Mensual";
  const costoCardLabel = esAnual ? "CTA" : "CTM";
  const opsLabelExt = esAnual ? "Pedidos por Año" : "Pedidos por Mes";
  const opsLabelFab = esAnual ? "Corridas de Prod. por Año" : "Corridas de Prod. por Mes";
  const periodoLabel = esAnual ? "Anual" : "Mensual";
  const ahorroLabel = esAnual ? "Ahorro Anual" : "Ahorro Mensual";
  const costoGlobalLabel = esAnual ? "Costo Total Anual Global" : "Costo Total Mensual Global";
  const factorH = esAnual ? 1 : 1 / 12;

  /* ---- reset ---- */
  const isDefault = useMemo(() => {
    return (
      demandaTotalMensual === DEFAULT_PARAMS.demandaTotalMensual &&
      porcentajeCompra === DEFAULT_PARAMS.porcentajeCompra &&
      porcentajeFabricacion === DEFAULT_PARAMS.porcentajeFabricacion &&
      costoPedidoCompra === DEFAULT_PARAMS.costoPedidoCompra &&
      costoUnitarioCompra === DEFAULT_PARAMS.costoUnitarioCompra &&
      costoPreparacionFab === DEFAULT_PARAMS.costoPreparacionFab &&
      costoUnitarioFab === DEFAULT_PARAMS.costoUnitarioFab &&
      tasaMantenimientoAnual === DEFAULT_PARAMS.tasaMantenimientoAnual &&
      capacidadProduccionMensual === DEFAULT_PARAMS.capacidadProduccionMensual &&
      periodo === DEFAULT_PARAMS.periodo
    );
  }, [
    demandaTotalMensual,
    porcentajeCompra,
    porcentajeFabricacion,
    costoPedidoCompra,
    costoUnitarioCompra,
    costoPreparacionFab,
    costoUnitarioFab,
    tasaMantenimientoAnual,
    capacidadProduccionMensual,
    periodo,
  ]);

  const handleReset = useCallback(() => {
    setDemandaTotalMensual(DEFAULT_PARAMS.demandaTotalMensual);
    setPorcentajeCompra(DEFAULT_PARAMS.porcentajeCompra);
    setPorcentajeFabricacion(DEFAULT_PARAMS.porcentajeFabricacion);
    setCostoPedidoCompra(DEFAULT_PARAMS.costoPedidoCompra);
    setCostoUnitarioCompra(DEFAULT_PARAMS.costoUnitarioCompra);
    setCostoPreparacionFab(DEFAULT_PARAMS.costoPreparacionFab);
    setCostoUnitarioFab(DEFAULT_PARAMS.costoUnitarioFab);
    setTasaMantenimientoAnual(DEFAULT_PARAMS.tasaMantenimientoAnual);
    setCapacidadProduccionMensual(DEFAULT_PARAMS.capacidadProduccionMensual);
    setPeriodo(DEFAULT_PARAMS.periodo);
  }, []);

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
        <div className="flex items-center gap-3">
          <Typography type="h1">Fabricar o Comprar</Typography>
          <Chip color="accent" size="sm" variant="soft">
            <CalendarDays className="mr-1 size-3" />
            {periodoLabel}
          </Chip>
        </div>
        <Typography className="mt-2" color="muted" type="body">
          Analisis comparativo entre la compra a proveedor externo (EOQ) y la produccion interna (EPQ)
        </Typography>
      </div>

      {/* Parametros */}
      <Card className="mb-8">
        <Card.Header>
          <div className="flex w-full items-center justify-between">
            <div>
              <Card.Title>Parametros del Modelo</Card.Title>
              <Card.Description>
                Ajuste los valores del sistema para el analisis comparativo
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
            {/* Toggle periodo */}
            <div className="flex items-center justify-between rounded-lg border border-default-200 bg-default-50 p-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4.5 text-muted" />
                <div>
                  <Typography className="text-sm font-medium" type="body">
                    Periodo de Calculo
                  </Typography>
                  <Typography className="text-xs" color="muted" type="body-sm">
                    {esAnual
                      ? "Demanda anualizada (x12). H usa la tasa anual completa."
                      : "Demanda mensual directa. H = i/12 para ser consistente mensualmente."}
                  </Typography>
                </div>
              </div>
              <Switch
                isSelected={periodo === "mensual"}
                onChange={(v) => setPeriodo(v ? "mensual" : "anual")}
              >
                <Typography className="text-sm font-medium" type="body">
                  {periodo === "anual" ? "Anual" : "Mensual"}
                </Typography>
              </Switch>
            </div>

            {/* Demanda */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Demanda
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ParamField
                  label="Demanda Total Mensual"
                  maxValue={10000000}
                  minValue={0}
                  step={1}
                  value={demandaTotalMensual}
                  onChange={setDemandaTotalMensual}
                />
                <ParamField
                  formatOptions={PERCENT_FMT}
                  label="% Compra (Proveedor Externo)"
                  maxValue={1}
                  minValue={0}
                  step={0.001}
                  value={porcentajeCompra}
                  onChange={setPorcentajeCompra}
                />
                <ParamField
                  formatOptions={PERCENT_FMT}
                  label="% Fabricacion (Interna)"
                  maxValue={1}
                  minValue={0}
                  step={0.001}
                  value={porcentajeFabricacion}
                  onChange={setPorcentajeFabricacion}
                />
              </div>
            </div>

            <Separator />

            {/* Proveedor externo */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Proveedor Externo (EOQ)
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="S &mdash; Costo de Pedido"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoPedidoCompra}
                  onChange={setCostoPedidoCompra}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="C &mdash; Costo Unitario"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoUnitarioCompra}
                  onChange={setCostoUnitarioCompra}
                />
              </div>
            </div>

            <Separator />

            {/* Produccion interna */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Produccion Interna (EPQ)
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="S &mdash; Costo de Preparacion"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoPreparacionFab}
                  onChange={setCostoPreparacionFab}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="C &mdash; Costo Unitario"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoUnitarioFab}
                  onChange={setCostoUnitarioFab}
                />
                <ParamField
                  label="p &mdash; Cap. Produccion Mensual"
                  maxValue={10000000}
                  minValue={0}
                  step={1}
                  value={capacidadProduccionMensual}
                  onChange={setCapacidadProduccionMensual}
                />
              </div>
            </div>

            <Separator />

            {/* Mantenimiento */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Costo de Mantenimiento
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ParamField
                  formatOptions={PERCENT_FMT}
                  label="i &mdash; Tasa de Mantenimiento Anual"
                  maxValue={1}
                  minValue={0}
                  step={0.001}
                  value={tasaMantenimientoAnual}
                  onChange={setTasaMantenimientoAnual}
                />
              </div>
              <div className="mt-3 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  {esAnual ? (
                    <>
                      H compra = {fmtPercent(tasaMantenimientoAnual)} x {fmtCurrency(costoUnitarioCompra)} ={" "}
                      {fmtCurrency(tasaMantenimientoAnual * costoUnitarioCompra)} &emsp; | &emsp;
                      H fab = {fmtPercent(tasaMantenimientoAnual)} x {fmtCurrency(costoUnitarioFab)} ={" "}
                      {fmtCurrency(tasaMantenimientoAnual * costoUnitarioFab)}
                    </>
                  ) : (
                    <>
                      H compra = {fmtPercent(tasaMantenimientoAnual)} / 12 x {fmtCurrency(costoUnitarioCompra)} ={" "}
                      {fmtCurrency(tasaMantenimientoAnual * costoUnitarioCompra * factorH)} &emsp; | &emsp;
                      H fab = {fmtPercent(tasaMantenimientoAnual)} / 12 x {fmtCurrency(costoUnitarioFab)} ={" "}
                      {fmtCurrency(tasaMantenimientoAnual * costoUnitarioFab * factorH)}
                    </>
                  )}
                </Typography>
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
              Comparativa de costos y cantidades optimas con desglose de calculo ({periodoLabel.toLowerCase()})
            </Typography>
          </div>

          {/* Tarjetas comparativas */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResultadoCard
              CTA={result.proveedorExterno.CTA}
              Q_optima={result.proveedorExterno.Q_optima}
              ctaLabel={`${costoCardLabel} — ${costoLabel}`}
              desglose_CTA={result.proveedorExterno.desglose_CTA}
              desglose_D={result.proveedorExterno.desglose_D}
              desglose_H={result.proveedorExterno.desglose_H}
              desglose_Q={result.proveedorExterno.desglose_Q}
              esGanador={result.totales.recomendacion === "comprar"}
              icono={ShoppingCart}
              operacionesPorPeriodo={result.proveedorExterno.pedidos_por_periodo}
              opsLabel={opsLabelExt}
              qLabel="Q optima — Lote de Compra"
              subtitulo="Modelo EOQ"
              titulo="Proveedor Externo"
            />
            <ResultadoCard
              CTA={result.produccionInterna.CTA}
              Q_optima={result.produccionInterna.Q_optima}
              ctaLabel={`${costoCardLabel} — ${costoLabel}`}
              desglose_CTA={result.produccionInterna.desglose_CTA}
              desglose_D={result.produccionInterna.desglose_D}
              desglose_H={result.produccionInterna.desglose_H}
              desglose_Q={result.produccionInterna.desglose_Q}
              desglose_factor={result.produccionInterna.desglose_factor}
              esGanador={result.totales.recomendacion === "fabricar"}
              icono={Factory}
              operacionesPorPeriodo={result.produccionInterna.corridas_por_periodo}
              opsLabel={opsLabelFab}
              qLabel="Q optima — Lote de Produccion"
              subtitulo="Modelo EPQ"
              titulo="Produccion Interna"
            />
          </div>

          {/* Costo total global */}
          <Card className="mb-8 ring-2 ring-accent/30 bg-accent/5">
            <Card.Header>
              <Chip color="accent" variant="primary">
                <TrendingDown className="mr-1 size-3" />
                Resumen Global
              </Chip>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Typography
                    className="text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    {costoGlobalLabel}
                  </Typography>
                  <Typography className="mt-1 text-2xl font-bold tabular-nums" type="body">
                    {fmtCurrency(result.totales.costo_global)}
                  </Typography>
                </div>
                <div>
                  <Typography
                    className="text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Recomendacion
                  </Typography>
                  <Typography
                    className={`mt-1 text-lg font-semibold ${result.totales.recomendacion === "comprar" ? "text-accent" : "text-success"}`}
                    type="body"
                  >
                    {result.totales.recomendacion === "comprar"
                      ? "Comprar a proveedor externo"
                      : "Fabricar internamente"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    className="text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    {ahorroLabel}
                  </Typography>
                  <Typography className="mt-1 text-lg font-semibold tabular-nums" type="body">
                    {fmtCurrency(result.totales.ahorro)}
                  </Typography>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Leyenda */}
          <Card>
            <Card.Content>
              <div className="rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>EOQ:</strong> Cantidad Economica de Pedido para proveedor externo.{" "}
                  <strong>EPQ:</strong> Cantidad Economica de Produccion para fabricacion interna.{" "}
                  Al alternar entre Anual/Mensual, la demanda y H se ajustan proporcionalmente.{" "}
                  El factor (1 - d/p) en EPQ usa demanda mensual / capacidad mensual para consistencia temporal.{" "}
                  Q optima es invariante al periodo seleccionado.
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
              Verifique que todos los parametros sean validos (Demanda, Costos, Tasa de Mantenimiento y Capacidad de Produccion mayores a cero).
            </Typography>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
