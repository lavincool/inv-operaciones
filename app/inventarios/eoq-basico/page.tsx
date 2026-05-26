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
import { RotateCcw, ArrowLeft, Package, ShoppingCart, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  calculateEOQBasico,
  type EOQBasicoInput,
  type EOQBasicoOutput,
} from "@/lib/eoq-basico";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (caso de prueba)                              */
/* ------------------------------------------------------------------ */

interface DefaultParams {
  demandaAnual: number;
  costoPedido: number;
  costoUnitario: number;
  tasaMantenimiento: number;
  tiempoEntrega: number;
}

const DEFAULT_PARAMS: DefaultParams = {
  demandaAnual: 6000,
  costoPedido: 300,
  costoUnitario: 200,
  tasaMantenimiento: 0.25,
  tiempoEntrega: 5,
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

export default function EOQBasicoPage() {
  /* ---- estado ---- */
  const [demandaAnual, setDemandaAnual] = useState(DEFAULT_PARAMS.demandaAnual);
  const [costoPedido, setCostoPedido] = useState(DEFAULT_PARAMS.costoPedido);
  const [costoUnitario, setCostoUnitario] = useState(DEFAULT_PARAMS.costoUnitario);
  const [tasaMantenimiento, setTasaMantenimiento] = useState(DEFAULT_PARAMS.tasaMantenimiento);
  const [tiempoEntrega, setTiempoEntrega] = useState(DEFAULT_PARAMS.tiempoEntrega);
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  /* ---- calculos ---- */
  const input: EOQBasicoInput = useMemo(
    () => ({
      demandaAnual,
      costoPedido,
      costoUnitario,
      tasaMantenimiento,
      tiempoEntrega,
    }),
    [demandaAnual, costoPedido, costoUnitario, tasaMantenimiento, tiempoEntrega],
  );

  const result: EOQBasicoOutput | null = useMemo(() => {
    try {
      return calculateEOQBasico(input);
    } catch {
      return null;
    }
  }, [input]);

  /* ---- H calculado para preview ---- */
  const H = tasaMantenimiento * costoUnitario;

  /* ---- reset ---- */
  const isDefault = useMemo(() => {
    return (
      demandaAnual === DEFAULT_PARAMS.demandaAnual &&
      costoPedido === DEFAULT_PARAMS.costoPedido &&
      costoUnitario === DEFAULT_PARAMS.costoUnitario &&
      tasaMantenimiento === DEFAULT_PARAMS.tasaMantenimiento &&
      tiempoEntrega === DEFAULT_PARAMS.tiempoEntrega
    );
  }, [demandaAnual, costoPedido, costoUnitario, tasaMantenimiento, tiempoEntrega]);

  const handleReset = useCallback(() => {
    setDemandaAnual(DEFAULT_PARAMS.demandaAnual);
    setCostoPedido(DEFAULT_PARAMS.costoPedido);
    setCostoUnitario(DEFAULT_PARAMS.costoUnitario);
    setTasaMantenimiento(DEFAULT_PARAMS.tasaMantenimiento);
    setTiempoEntrega(DEFAULT_PARAMS.tiempoEntrega);
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
        <Typography type="h1">Modelo EOQ Basico (Sin Escasez)</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Calculo de la Cantidad Economica de Pedido clasica con Punto de Reorden Complejo para Lead Times largos
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
                  step={100}
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
                  formatOptions={CURRENCY_FMT}
                  label="C &mdash; Costo Unitario"
                  maxValue={1000000}
                  minValue={0}
                  step={0.01}
                  value={costoUnitario}
                  onChange={setCostoUnitario}
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
                <ParamField
                  label="L &mdash; Tiempo de Entrega (semanas)"
                  maxValue={52}
                  minValue={0}
                  step={0.5}
                  value={tiempoEntrega}
                  onChange={setTiempoEntrega}
                />
              </div>

              {/* Preview de H */}
              <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  H = i x C = {fmtPercent(tasaMantenimiento)} x {fmtCurrency(costoUnitario)} = {fmtCurrency(H)} (Costo de mantener una unidad durante un año)
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
              Cantidad optima de pedido y costos del sistema de inventario
            </Typography>
          </div>

          {/* Tarjetas de resultados principales */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Q optima */}
            <Card variant="tertiary" className="ring-2 ring-accent/50 shadow-lg shadow-accent/5">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Package className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Cantidad Optima (Q*)</Card.Title>
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

            {/* Punto de Reorden */}
            <Card variant="tertiary">
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <AlertTriangle className="size-4.5" />
                  </div>
                  <div>
                    <Card.Title>Punto de Reorden (PR)</Card.Title>
                    <Card.Description>Nivel de inventario de alerta</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <Typography className="text-2xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.puntoReorden, 4)} unidades
                </Typography>
              </Card.Content>
            </Card>
          </div>

          {/* Numero de pedidos y CTA */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Typography className="text-2xl font-bold tabular-nums" type="body">
                  {fmtDecimal(result.numeroPedidos, 4)}
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
                    <Card.Description>Costo de ordenar + mantener</Card.Description>
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
                  label="Cantidad Optima de Pedido (Q*)"
                  latex={result.desgloses.Q}
                />
                <Separator />
                <PasoDesglose
                  label="Numero de Pedidos al Ano (N)"
                  latex={result.desgloses.N}
                />
                <Separator />
                <PasoDesglose
                  label="Costo Total Anual (CTA)"
                  latex={result.desgloses.CTA}
                />
                <Separator />
                <PasoDesglose
                  label="Punto de Reorden Complejo (PR) — 5 pasos"
                  latex={result.desgloses.PR}
                />
              </div>

              {/* Leyenda del PR */}
              <div className="mt-6 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Interpretacion del Punto de Reorden:</strong> Cuando el inventario baje a <strong>{fmtDecimal(result.puntoReorden, 2)} unidades</strong>, se debe emitir una nueva orden. El algoritmo descuenta los ciclos completos del Lead Time (5 pasos) para calcular correctamente el punto de reorden cuando el tiempo de entrega del proveedor es mayor que la duracion de un ciclo de inventario.
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
              Verifique que todos los parametros sean validos (Demanda, Costo de Pedido, Costo Unitario y Tasa de Mantenimiento mayores a cero, y Tiempo de Entrega no negativo).
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
                Fabricacion de escritorios — Modelo EOQ Basico con Punto de Reorden
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
                    La demanda de escritorios para una fabrica de muebles para oficina es{" "}
                    <strong className="text-accent">6000</strong> al año en promedio. Cada vez que se
                    hace un pedido de escritorios se incurre en un costo de{" "}
                    <strong className="text-accent">$300</strong> dolares. El costo anual por tener en
                    inventario un solo escritorio es del <strong className="text-accent">25%</strong>{" "}
                    de su costo, que es <strong className="text-accent">$200</strong> dolares.
                    Transcurre <strong className="text-accent">1 semana</strong> entre el momento en
                    que se hace un pedido y la llegada del mismo. Suponga que no se permite escasez.
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
                    <div><strong>D</strong> = 6000 unid/año</div>
                    <div><strong>S</strong> = $300 / pedido</div>
                    <div><strong>C</strong> = $200 / escritorio</div>
                    <div><strong>i</strong> = 25% = 0.25</div>
                    <div><strong>L</strong> = 1 semana (inciso d)</div>
                    <div><strong>L&prime;</strong> = 5 semanas (inciso d alterno)</div>
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
                    <li>¿Cuantos escritorios se deben pedir cada vez que se hace un pedido?</li>
                    <li>¿Cuántos pedidos se pueden colocar en un año?</li>
                    <li>Calcule los costos totales anuales.</li>
                    <li>
                      Determine el punto de reorden. Si el tiempo de entrega fuera 5 semanas
                      ¿cual seria el punto de reorden?
                    </li>
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
