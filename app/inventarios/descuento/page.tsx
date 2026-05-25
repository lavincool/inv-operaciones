"use client";

import { useMemo, useState, useCallback } from "react";
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
import { RotateCcw, TrendingDown, ArrowLeft, Plus, Trash2, Infinity as InfinityIcon } from "lucide-react";
import Link from "next/link";
import {
  calculateEOQDiscount,
  type EOQDiscountInput,
  type RangoPrecio,
  type EOQDiscountOutput,
} from "@/lib/eoq-discount";

/* ------------------------------------------------------------------ */
/*  Valores por defecto (caso de prueba)                              */
/* ------------------------------------------------------------------ */

const DEFAULT_RANGOS: RangoPrecio[] = [
  { min: 1, max: 599, precioUnitario: 12 },
  { min: 600, max: 1199, precioUnitario: 11.5 },
  { min: 1200, max: 1799, precioUnitario: 11.1 },
  { min: 1800, max: null, precioUnitario: 11 },
];

interface DefaultParams {
  demandaAnual: number;
  costoPedido: number;
  tasaMantenimiento: number;
  costoMantenimientoConstante: boolean;
  rangos: RangoPrecio[];
}

const DEFAULT_PARAMS: DefaultParams = {
  demandaAnual: 2200,
  costoPedido: 16,
  tasaMantenimiento: 0.2,
  costoMantenimientoConstante: true,
  rangos: DEFAULT_RANGOS,
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

function fmtDecimal(value: number, decimals = 2): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
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

export default function DescuentoPage() {
  /* ---- estado ---- */
  const [demandaAnual, setDemandaAnual] = useState(DEFAULT_PARAMS.demandaAnual);
  const [costoPedido, setCostoPedido] = useState(DEFAULT_PARAMS.costoPedido);
  const [tasaMantenimiento, setTasaMantenimiento] = useState(DEFAULT_PARAMS.tasaMantenimiento);
  const [costoMantenimientoConstante, setCostoMantenimientoConstante] = useState(
    DEFAULT_PARAMS.costoMantenimientoConstante,
  );
  const [rangos, setRangos] = useState<RangoPrecio[]>(DEFAULT_PARAMS.rangos);

  /* ---- calculos ---- */
  const input: EOQDiscountInput = useMemo(
    () => ({
      demandaAnual,
      costoPedido,
      tasaMantenimiento,
      costoMantenimientoConstante,
      rangos,
    }),
    [demandaAnual, costoPedido, tasaMantenimiento, costoMantenimientoConstante, rangos],
  );

  const result: EOQDiscountOutput | null = useMemo(() => {
    try {
      return calculateEOQDiscount(input);
    } catch {
      return null;
    }
  }, [input]);

  const HBase = useMemo(() => {
    if (rangos.length > 0) {
      return tasaMantenimiento * rangos[0].precioUnitario;
    }
    return 0;
  }, [tasaMantenimiento, rangos]);

  /* ---- helpers de rangos ---- */
  const updateRango = useCallback(
    (index: number, partial: Partial<RangoPrecio>) => {
      setRangos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...partial };
        return next;
      });
    },
    [],
  );

  const toggleUnlimited = useCallback(
    (index: number, unlimited: boolean) => {
      setRangos((prev) => {
        const next = [...prev];
        if (unlimited) {
          next[index] = { ...next[index], max: null };
        } else {
          const siguiente = prev[index + 1];
          const defaultMax = siguiente ? siguiente.min - 1 : next[index].min + 500;
          next[index] = { ...next[index], max: defaultMax };
        }
        return next;
      });
    },
    [],
  );

  const addRango = useCallback(() => {
    setRangos((prev) => {
      const last = prev[prev.length - 1];
      const newMin = last ? last.min + 600 : 1;
      return [...prev, { min: newMin, max: null, precioUnitario: last ? last.precioUnitario - 0.1 : 10 }];
    });
  }, []);

  const removeRango = useCallback((index: number) => {
    setRangos((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /* ---- reset ---- */
  const isDefault = useMemo(() => {
    return (
      demandaAnual === DEFAULT_PARAMS.demandaAnual &&
      costoPedido === DEFAULT_PARAMS.costoPedido &&
      tasaMantenimiento === DEFAULT_PARAMS.tasaMantenimiento &&
      costoMantenimientoConstante === DEFAULT_PARAMS.costoMantenimientoConstante &&
      rangos.length === DEFAULT_PARAMS.rangos.length &&
      rangos.every(
        (r, i) =>
          r.min === DEFAULT_PARAMS.rangos[i].min &&
          r.max === DEFAULT_PARAMS.rangos[i].max &&
          r.precioUnitario === DEFAULT_PARAMS.rangos[i].precioUnitario,
      )
    );
  }, [demandaAnual, costoPedido, tasaMantenimiento, costoMantenimientoConstante, rangos]);

  const handleReset = useCallback(() => {
    setDemandaAnual(DEFAULT_PARAMS.demandaAnual);
    setCostoPedido(DEFAULT_PARAMS.costoPedido);
    setTasaMantenimiento(DEFAULT_PARAMS.tasaMantenimiento);
    setCostoMantenimientoConstante(DEFAULT_PARAMS.costoMantenimientoConstante);
    setRangos([...DEFAULT_PARAMS.rangos]);
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
        <Typography type="h1">Modelo EOQ con Descuentos por Cantidad</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Determinacion de la cantidad optima de pedido considerando descuentos por volumen
        </Typography>
      </div>

      {/* Parametros */}
      <Card className="mb-8">
        <Card.Header>
          <div className="flex w-full items-center justify-between">
            <div>
              <Card.Title>Parametros del Modelo</Card.Title>
              <Card.Description>
                Ajuste los valores del sistema y los rangos de precio
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
            {/* Parametros del sistema */}
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
                  label="D &mdash; Demanda Anual"
                  maxValue={1000000}
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
                  step={1}
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

              {/* Regla de H */}
              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-default-200 p-3">
                <Switch
                  isSelected={costoMantenimientoConstante}
                  onChange={setCostoMantenimientoConstante}
                >
                  <Typography className="text-sm font-medium" type="body">Costo de Mantenimiento Constante</Typography>
                </Switch>
                <Typography className="text-xs" color="muted" type="body-sm">
                  {costoMantenimientoConstante
                    ? `H = i \u00d7 Precio Base = ${fmtPercent(tasaMantenimiento)} \u00d7 ${rangos.length > 0 ? fmtCurrency(rangos[0].precioUnitario) : "—"} = ${fmtCurrency(HBase)} (se usa el mismo H para todos los rangos)`
                    : `H = i \u00d7 Precio del Rango (H varia segun el precio de cada rango)`}
                </Typography>
              </div>
            </div>

            <Separator />

            {/* Rangos de precio */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Rangos de Precio por Cantidad
              </Typography>

              <div className="space-y-3">
                {rangos.map((rango, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border border-default-200"
                  >
                    {/* Header de rango */}
                    <div className="flex items-center justify-between bg-default-100 px-4 py-2">
                      <Typography className="text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">
                        Rango {index + 1}
                      </Typography>
                      <Button
                        isDisabled={rangos.length <= 1}
                        isIconOnly
                        aria-label={`Eliminar rango ${index + 1}`}
                        size="sm"
                        variant="ghost"
                        onPress={() => removeRango(index)}
                      >
                        <Trash2 className="size-3.5 text-muted" />
                      </Button>
                    </div>

                    {/* Cuerpo del rango */}
                    <div className="space-y-4 p-4">
                      {/* Fila: min y max */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <NumberField
                          className="w-full"
                          minValue={1}
                          name={`min-${index}`}
                          step={1}
                          value={rango.min}
                          onChange={(v) => updateRango(index, { min: v ?? 1 })}
                        >
                          <Label>Cantidad minima</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>

                        {rango.max !== null ? (
                          <NumberField
                            className="w-full"
                            minValue={1}
                            name={`max-${index}`}
                            step={1}
                            value={rango.max}
                            onChange={(v) => updateRango(index, { max: v ?? 1 })}
                          >
                            <Label>Cantidad maxima</Label>
                            <NumberField.Group>
                              <NumberField.DecrementButton />
                              <NumberField.Input />
                              <NumberField.IncrementButton />
                            </NumberField.Group>
                          </NumberField>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Typography className="text-xs" color="muted" type="body-sm">
                              Cantidad maxima
                            </Typography>
                            <div className="flex h-10 items-center rounded-lg border border-default-200 bg-default-100 px-3">
                              <InfinityIcon className="size-3.5 text-muted" />
                              <span className="ml-2 text-xs text-muted">Sin limite</span>
                            </div>
                          </div>
                        )}

                        <label className="flex cursor-pointer select-none items-center gap-1.5 self-end pb-2">
                          <input
                            checked={rango.max === null}
                            className="size-3.5 rounded border-default-400 bg-default-100 accent-success"
                            type="checkbox"
                            onChange={(e) => toggleUnlimited(index, e.target.checked)}
                          />
                          <span className="text-xs text-muted">o mas</span>
                        </label>
                      </div>

                      {/* Fila: precio */}
                      <NumberField
                        className="w-full"
                        formatOptions={CURRENCY_FMT}
                        minValue={0}
                        name={`precio-${index}`}
                        step={0.5}
                        value={rango.precioUnitario}
                        onChange={(v) => updateRango(index, { precioUnitario: v ?? 0.01 })}
                      >
                        <Label>Precio Unitario</Label>
                        <NumberField.Group>
                          <NumberField.DecrementButton />
                          <NumberField.Input />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="mt-3"
                size="sm"
                variant="primary"
                onPress={addRango}
              >
                <Plus className="size-3.5" />
                Agregar Rango
              </Button>
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
              Cantidad optima de pedido y desglose de costos por rango
            </Typography>
          </div>

          {/* Tarjeta del optimo */}
          <Card
            className="mb-8 ring-2 ring-success/50 shadow-lg shadow-success/10"
            variant="tertiary"
          >
            <Card.Header>
              <Chip color="success" variant="primary">
                <TrendingDown className="mr-1 size-3" />
                Resultado Optimo
              </Chip>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Typography className="text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">
                    Cantidad Optima a Ordenar (Q*)
                  </Typography>
                  <Typography className="mt-1 text-2xl font-bold tabular-nums" type="body">
                    {fmtDecimal(result.cantidadOptima, 0)} unidades
                  </Typography>
                </div>
                <div>
                  <Typography className="text-xs font-semibold uppercase tracking-wider" color="muted" type="body-sm">
                    Costo Total Anual Minimo
                  </Typography>
                  <Typography className="mt-1 text-2xl font-bold tabular-nums text-success" type="body">
                    {fmtCurrency(result.costoTotalMinimo)}
                  </Typography>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Tabla de desglose */}
          <Card>
            <Card.Header>
              <Card.Title>Desglose por Rango de Precio</Card.Title>
              <Card.Description>
                Comparativa de la Q calculada, Q ajustada y costos para cada rango
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-default-200 text-left">
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Rango
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Q Calc.
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Q Ajust.
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Costo Compra
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Costo Pedido
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Costo Mant.
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Costo Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.desglose.map((row) => (
                      <tr
                        key={row.rangoTexto}
                        className={`border-b border-default-100 transition-colors ${
                          row.esOptimo ? "bg-success/10" : "hover:bg-default-50"
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                          <div className="flex items-center gap-1.5">
                            {row.rangoTexto}
                            {row.esOptimo && (
                              <Chip color="success" size="sm" variant="primary">
                                optimo
                              </Chip>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                          {fmtDecimal(row.qCalculada, 2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                          {row.qAjustada > 0 ? fmtDecimal(row.qAjustada, 2) : "\u2014"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                          {fmtCurrency(row.costoCompra)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                          {row.qAjustada > 0 ? fmtCurrency(row.costoPedido) : "\u2014"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                          {row.qAjustada > 0 ? fmtCurrency(row.costoMantenimiento) : "\u2014"}
                        </td>
                        <td className={`whitespace-nowrap px-3 py-2.5 tabular-nums font-semibold ${row.esOptimo ? "text-success" : ""}`}>
                          {row.costoTotalAnual !== Infinity ? fmtCurrency(row.costoTotalAnual) : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda */}
              <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                <Typography className="text-xs" color="muted" type="body-sm">
                  <strong>Q Calc.:</strong> Cantidad economica teorica (EOQ) calculada con H del rango.{" "}
                  <strong>Q Ajust.:</strong> Q ajustada al limite inferior del rango si Q Calc. es menor, o descartada si excede el maximo.{" "}
                  La fila destacada en verde representa la solucion de menor costo total.
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
              Verifique que todos los parametros sean validos (Demanda, Costo de Pedido y Tasa de Mantenimiento mayores a cero, y al menos un rango de precio definido).
            </Typography>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
