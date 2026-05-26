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
  CheckCircle,
  XCircle,
  BookOpen,
  TrendingDown,
  Package,
  Percent,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  calculateEOQDescuentos,
  type EOQDescuentosInput,
  type EOQDescuentosOutput,
} from "@/lib/eoq-descuentos";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (carrusel de ejemplos)                        */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  demandaAnual: number;
  costoPedido: number;
  tasaMantenimiento: number;
  precioNormal: number;
  precioDescuento: number;
  umbralDescuento: number;
}

const DEFAULT_PARAMS: DefaultParams[] = [
  {
    demandaAnual: 400,
    costoPedido: 20,
    tasaMantenimiento: 0.2,
    precioNormal: 50,
    precioDescuento: 49,
    umbralDescuento: 100,
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

function fmtPercent(value: number): string {
  return value.toLocaleString("es-MX", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
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

export default function EOQDescuentosPage() {
  /* ---- indice del ejemplo actual ---- */
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDefaults = DEFAULT_PARAMS[currentIndex];

  /* ---- estado ---- */
  const [demandaAnual, setDemandaAnual] = useState(currentDefaults.demandaAnual);
  const [costoPedido, setCostoPedido] = useState(currentDefaults.costoPedido);
  const [tasaMantenimiento, setTasaMantenimiento] = useState(
    currentDefaults.tasaMantenimiento,
  );
  const [precioNormal, setPrecioNormal] = useState(currentDefaults.precioNormal);
  const [precioDescuento, setPrecioDescuento] = useState(
    currentDefaults.precioDescuento,
  );
  const [umbralDescuento, setUmbralDescuento] = useState(
    currentDefaults.umbralDescuento,
  );
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  /* ---- calculos ---- */
  const input: EOQDescuentosInput = useMemo(
    () => ({
      demandaAnual,
      costoPedido,
      tasaMantenimiento,
      precioNormal,
      precioDescuento,
      umbralDescuento,
    }),
    [demandaAnual, costoPedido, tasaMantenimiento, precioNormal, precioDescuento, umbralDescuento],
  );

  const result: EOQDescuentosOutput | null = useMemo(() => {
    try {
      return calculateEOQDescuentos(input);
    } catch {
      return null;
    }
  }, [input]);

  /* ---- H calculados para preview ---- */
  const H1 = tasaMantenimiento * precioNormal;
  const H2 = tasaMantenimiento * precioDescuento;

  /* ---- carga de ejemplo por indice ---- */
  const loadExample = useCallback(
    (index: number) => {
      if (index < 0 || index >= DEFAULT_PARAMS.length) return;
      const p = DEFAULT_PARAMS[index];
      setCurrentIndex(index);
      setDemandaAnual(p.demandaAnual);
      setCostoPedido(p.costoPedido);
      setTasaMantenimiento(p.tasaMantenimiento);
      setPrecioNormal(p.precioNormal);
      setPrecioDescuento(p.precioDescuento);
      setUmbralDescuento(p.umbralDescuento);
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
      tasaMantenimiento === currentDefaults.tasaMantenimiento &&
      precioNormal === currentDefaults.precioNormal &&
      precioDescuento === currentDefaults.precioDescuento &&
      umbralDescuento === currentDefaults.umbralDescuento
    );
  }, [
    demandaAnual,
    costoPedido,
    tasaMantenimiento,
    precioNormal,
    precioDescuento,
    umbralDescuento,
    currentDefaults,
  ]);

  const handleReset = useCallback(() => {
    setDemandaAnual(currentDefaults.demandaAnual);
    setCostoPedido(currentDefaults.costoPedido);
    setTasaMantenimiento(currentDefaults.tasaMantenimiento);
    setPrecioNormal(currentDefaults.precioNormal);
    setPrecioDescuento(currentDefaults.precioDescuento);
    setUmbralDescuento(currentDefaults.umbralDescuento);
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
            <Typography type="h1">EOQ con Descuentos por Cantidad</Typography>
            <Typography className="mt-2" color="muted" type="body">
              Evalúa si conviene aceptar un descuento del proveedor aumentando el tamaño del pedido, comparando el Costo Total Anual incluyendo compra de material
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
                Ajuste los valores del sistema para evaluar la conveniencia del descuento
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
            {/* Parametros del sistema */}
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
                  step={50}
                  value={demandaAnual}
                  onChange={setDemandaAnual}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="S &mdash; Costo de Pedido"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoPedido}
                  onChange={setCostoPedido}
                />
                <ParamField
                  formatOptions={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  label="i &mdash; Tasa de Mantenimiento"
                  maxValue={1}
                  minValue={0}
                  step={0.005}
                  value={tasaMantenimiento}
                  onChange={setTasaMantenimiento}
                />
              </div>
            </div>

            <Separator />

            {/* Parametros del descuento */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Propuesta del Proveedor
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="C1 &mdash; Precio Normal"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={precioNormal}
                  onChange={setPrecioNormal}
                />
                <ParamField
                  formatOptions={CURRENCY_FMT}
                  label="C2 &mdash; Precio con Descuento"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={precioDescuento}
                  onChange={setPrecioDescuento}
                />
                <ParamField
                  label="q_min &mdash; Umbral de Descuento"
                  maxValue={10000000}
                  minValue={0}
                  step={10}
                  value={umbralDescuento}
                  onChange={setUmbralDescuento}
                />
              </div>

              {/* Preview de H1 y H2 */}
              <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  H1 = i x C1 = {fmtPercent(tasaMantenimiento)} x {fmtCurrency(precioNormal)} = {fmtCurrency(H1)}
                  <br />
                  H2 = i x C2 = {fmtPercent(tasaMantenimiento)} x {fmtCurrency(precioDescuento)} = {fmtCurrency(H2)} (Costo de mantener una unidad durante un año)
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
              Comparativa del Costo Total Anual con y sin descuento
            </Typography>
          </div>

          {/* Tarjeta de decision */}
          <Card
            className={`mb-8 ring-2 shadow-lg ${
              result.convieneDescuento
                ? "ring-success/50 shadow-success/10"
                : "ring-danger/50 shadow-danger/10"
            }`}
            variant="tertiary"
          >
            <Card.Header>
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    result.convieneDescuento
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {result.convieneDescuento ? (
                    <CheckCircle className="size-5" />
                  ) : (
                    <XCircle className="size-5" />
                  )}
                </div>
                <div>
                  <Card.Title>Decision</Card.Title>
                  <Card.Description>
                    {result.convieneDescuento
                      ? "Conviene aceptar el descuento del proveedor"
                      : "No conviene aceptar el descuento del proveedor"}
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <Typography
                className={`text-xl font-bold ${
                  result.convieneDescuento ? "text-success" : "text-danger"
                }`}
                type="body"
              >
                {result.decision}
              </Typography>
            </Card.Content>
          </Card>

          {/* Comparativa CTA1 vs CTA2 */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* CTA sin descuento */}
            <Card
              variant="tertiary"
              className={
                !result.convieneDescuento
                  ? "ring-2 ring-success/50 shadow-lg shadow-success/5"
                  : ""
              }
            >
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <DollarSign className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Sin Descuento (CTA1)</Card.Title>
                    <Card.Description>Q* = {fmtDecimal(result.cantidadOptima1, 2)} unid, precio normal</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-2xl font-bold tabular-nums" type="body">
                  {fmtCurrency(result.costoTotal1)}
                </Typography>
              </Card.Content>
            </Card>

            {/* CTA con descuento */}
            <Card
              variant="tertiary"
              className={
                result.convieneDescuento
                  ? "ring-2 ring-success/50 shadow-lg shadow-success/5"
                  : ""
              }
            >
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
                    <TrendingDown className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Con Descuento (CTA2)</Card.Title>
                    <Card.Description>Q = {fmtDecimal(umbralDescuento, 0)} unid, precio descuento</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className={`text-2xl font-bold tabular-nums ${result.convieneDescuento ? "text-success" : ""}`} type="body">
                  {fmtCurrency(result.costoTotal2)}
                </Typography>
              </Card.Content>
            </Card>
          </div>

          {/* Tarjetas complementarias */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card variant="tertiary" className="ring-2 ring-accent/50 shadow-lg shadow-accent/5">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Package className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Cantidad Optima (Q*)</Card.Title>
                    <Card.Description>Sin descuento</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.cantidadOptima1, 2)} unid
                </Typography>
              </Card.Content>
            </Card>

            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-default-100 text-muted">
                    <Percent className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Ahorro / Sobrecosto</Card.Title>
                    <Card.Description>Diferencia CTA2 - CTA1</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography
                  className={`text-xl font-bold tabular-nums ${result.convieneDescuento ? "text-success" : "text-danger"}`}
                  type="body"
                >
                  {result.convieneDescuento ? "-" : "+"}
                  {fmtCurrency(Math.abs(result.costoTotal2 - result.costoTotal1))}
                </Typography>
              </Card.Content>
            </Card>

            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <DollarSign className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Umbral Minimo</Card.Title>
                    <Card.Description>Para acceder al descuento</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-xl font-bold tabular-nums" type="body">
                  {fmtDecimal(umbralDescuento, 0)} unid
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
                  label="Cantidad Optima sin Descuento (Q*)"
                  latex={result.desgloses.Q1}
                />
                <Separator />
                <PasoDesglose
                  label="Costo Total Anual — Sin Descuento (CTA1)"
                  latex={result.desgloses.CTA1}
                />
                <Separator />
                <PasoDesglose
                  label="Costo Total Anual — Con Descuento (CTA2)"
                  latex={result.desgloses.CTA2}
                />
              </div>

              {/* Interpretacion */}
              <div className="mt-6 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Interpretacion:</strong> La cantidad optima sin descuento es{" "}
                  <strong>{fmtDecimal(result.cantidadOptima1, 2)} unidades</strong>.{" "}
                  El costo total anual comprando a precio normal es{" "}
                  <strong>{fmtCurrency(result.costoTotal1)}</strong>.{" "}
                  Si se acepta el descuento y se pide el minimo de{" "}
                  <strong>{fmtDecimal(umbralDescuento, 0)} unidades</strong>, el costo total anual es{" "}
                  <strong>{fmtCurrency(result.costoTotal2)}</strong>.{" "}
                  {result.convieneDescuento
                    ? "Por lo tanto, SI conviene aceptar la oferta del proveedor."
                    : "Por lo tanto, NO conviene aceptar la oferta del proveedor."}
                </Typography>
              </div>

              {/* Nota sobre Q* vs umbral */}
              <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Nota:</strong> El Costo Total Anual incluye el costo de adquisicion de material (D x C), el costo de ordenar ((D/Q) x S) y el costo de mantener ((Q/2) x H). Se comparan dos escenarios: (1) comprar Q* = {fmtDecimal(result.cantidadOptima1, 2)} unidades a ${fmtDecimal(precioNormal, 2)} c/u vs (2) comprar al menos {fmtDecimal(umbralDescuento, 0)} unidades a ${fmtDecimal(precioDescuento, 2)} c/u.
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
              Verifique que todos los parametros sean validos (Demanda, Costo de Pedido, Tasa de Mantenimiento, Precios y Umbral mayores a cero, y Precio con Descuento menor al Precio Normal).
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
                Precision Company — EOQ con Descuento por Cantidad
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
                    La Precision Company compra valvulas de solenoide para usarlas en su linea de soldadoras de puntos. La compañía compra por lo menos{" "}
                    <strong className="text-accent">400</strong> valvulas al año, y con un costo de{" "}
                    <strong className="text-accent">$50 dls</strong> cada una. Los costos cargados al inventario son de{" "}
                    <strong className="text-accent">20%</strong> del valor promedio de inventario y los costos de pedidos son de{" "}
                    <strong className="text-accent">$20 dls</strong> por pedido. La empresa ha recibido una proposicion del proveedor para concederle un descuento de{" "}
                    <strong className="text-accent">2%</strong> en compras de{" "}
                    <strong className="text-accent">100</strong> valvulas o mas. ¿Debe aceptar la oferta? ¿Cual seria el punto optimo?
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
                    <div><strong>D</strong> = 400 unid/año</div>
                    <div><strong>S</strong> = $20 / pedido</div>
                    <div><strong>i</strong> = 20% = 0.20</div>
                    <div><strong>C1</strong> = $50 / unid (normal)</div>
                    <div><strong>C2</strong> = $49 / unid (descuento 2%)</div>
                    <div><strong>q_min</strong> = 100 unid (umbral)</div>
                  </div>
                </div>

                <Separator />

                {/* Resolucion */}
                <div className="rounded-lg border border-default-200 bg-default-50 p-4">
                  <Typography
                    className="mb-3 text-xs font-semibold uppercase tracking-wider"
                    color="muted"
                    type="body-sm"
                  >
                    Resolucion
                  </Typography>

                  <div className="space-y-4 text-sm">
                    {/* Paso 1 */}
                    <div>
                      <Typography className="mb-1 font-semibold" type="body-sm">
                        1. Costo de Mantenimiento:
                      </Typography>
                      <Typography className="leading-relaxed" color="muted" type="body-sm">
                        H1 = i x C1 = 0.20 x 50 = $10 / unid-año<br />
                        H2 = i x C2 = 0.20 x 49 = $9.80 / unid-año
                      </Typography>
                    </div>

                    {/* Paso 2 */}
                    <div>
                      <Typography className="mb-1 font-semibold" type="body-sm">
                        2. Cantidad Optima sin descuento:
                      </Typography>
                      <Typography className="leading-relaxed" color="muted" type="body-sm">
                        Q* = sqrt(2 x 400 x 20 / 10) = sqrt(1600) = 40 unidades
                      </Typography>
                    </div>

                    {/* Paso 3 */}
                    <div>
                      <Typography className="mb-1 font-semibold" type="body-sm">
                        3. Costo Total Anual — Sin descuento:
                      </Typography>
                      <Typography className="leading-relaxed" color="muted" type="body-sm">
                        CTA1 = 400 x 50 + (400/40) x 20 + (40/2) x 10<br />
                        CTA1 = 20000 + 200 + 200 = $20,400
                      </Typography>
                    </div>

                    {/* Paso 4 */}
                    <div>
                      <Typography className="mb-1 font-semibold" type="body-sm">
                        4. Costo Total Anual — Con descuento (q = 100):
                      </Typography>
                      <Typography className="leading-relaxed" color="muted" type="body-sm">
                        CTA2 = 400 x 49 + (400/100) x 20 + (100/2) x 9.8<br />
                        CTA2 = 19600 + 80 + 490 = $20,170
                      </Typography>
                    </div>

                    {/* Conclusion */}
                    <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                      <Typography className="font-semibold text-success" type="body-sm">
                        Decision: Si conviene aceptar el descuento.
                      </Typography>
                      <Typography className="leading-relaxed" color="muted" type="body-sm">
                        CTA2 ($20,170) &lt; CTA1 ($20,400) → Ahorro de $230 al año.
                        La empresa debe ordenar 100 valvulas por pedido para aprovechar el descuento del 2%.
                      </Typography>
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
