"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Chip,
  Button,
  Card,
  Label,
  NumberField,
  ProgressBar,
  Separator,
  Typography,
} from "@heroui/react";
import { RotateCcw, TrendingDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calculateScenarios, type QueueParams } from "@/lib/queuing-theory";

const DEFAULT_PARAMS: QueueParams = {
  N: 10,
  lambda: 0.05,
  mu: 0.5,
  Cs: 80000,
  Cw: 130000,
};

const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", CURRENCY_FORMAT).format(value);
}

function formatDecimal(value: number, decimals = 4): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("es-MX", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

interface ParamFieldProps {
  label: string;
  name: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  step: number;
  formatOptions?: Intl.NumberFormatOptions;
  onChange: (v: number) => void;
}

function ParamField({
  label,
  name,
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
      name={name}
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

export default function PoblacionFinitaPage() {
  const [params, setParams] = useState<QueueParams>(DEFAULT_PARAMS);

  const scenarios = useMemo(() => calculateScenarios(params), [params]);

  const bestCost = useMemo(
    () => Math.min(...scenarios.map((s) => s.cost)),
    [scenarios],
  );

  const worstCost = useMemo(
    () => Math.max(...scenarios.map((s) => s.cost)),
    [scenarios],
  );

  const rho = useMemo(
    () => params.lambda / params.mu,
    [params.lambda, params.mu],
  );

  const savings = useMemo(() => worstCost - bestCost, [worstCost, bestCost]);

  const savingsPercent = useMemo(
    () => (worstCost > 0 ? savings / worstCost : 0),
    [savings, worstCost],
  );

  const updateParam = useCallback(
    (key: keyof QueueParams, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  const isDefault = useMemo(() => {
    return Object.entries(DEFAULT_PARAMS).every(
      ([key, val]) => params[key as keyof QueueParams] === val,
    );
  }, [params]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Breadcrumb + header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          <span>Inicio</span>
        </Link>
        <Typography type="h1">Teoria de Colas</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Modelo de Poblacion Finita con Multiples Servidores &middot; Analisis
          y comparacion de costos
        </Typography>
      </div>

      {/* Parameters Card */}
      <Card className="mb-8">
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <div>
              <Card.Title>Parametros del Modelo</Card.Title>
              <Card.Description>
                Ajuste los valores para calcular los indicadores de desempeño
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
            {/* System parameters */}
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
                  label="N &mdash; Poblacion Total"
                  maxValue={100}
                  minValue={1}
                  name="N"
                  step={1}
                  value={params.N}
                  onChange={(v) => updateParam("N", v)}
                />
                <ParamField
                  label="&lambda; &mdash; Tasa de Llegada"
                  maxValue={100}
                  minValue={0.001}
                  name="lambda"
                  step={0.01}
                  value={params.lambda}
                  onChange={(v) => updateParam("lambda", v)}
                />
                <ParamField
                  label="&mu; &mdash; Tasa de Servicio"
                  maxValue={100}
                  minValue={0.001}
                  name="mu"
                  step={0.01}
                  value={params.mu}
                  onChange={(v) => updateParam("mu", v)}
                />
              </div>
              {/* Factor de utilizacion */}
              <div className="mt-3 flex items-center gap-2">
                <Typography className="text-xs" color="muted" type="body-sm">
                  Factor de utilizacion (&rho;):
                </Typography>
                <Chip
                  color={rho >= 1 ? "danger" : rho >= 0.7 ? "warning" : "success"}
                  size="sm"
                  variant="soft"
                >
                  &rho; = {formatDecimal(rho, 4)}
                </Chip>
              </div>
            </div>

            <Separator />

            {/* Cost parameters */}
            <div>
              <Typography
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                color="muted"
                type="body-sm"
              >
                Parametros de Costo
              </Typography>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ParamField
                  formatOptions={CURRENCY_FORMAT}
                  label="Cs &mdash; Costo por Servidor"
                  minValue={0}
                  name="Cs"
                  step={5000}
                  value={params.Cs}
                  onChange={(v) => updateParam("Cs", v)}
                />
                <ParamField
                  formatOptions={CURRENCY_FORMAT}
                  label="Cw &mdash; Costo de Espera"
                  minValue={0}
                  name="Cw"
                  step={5000}
                  value={params.Cw}
                  onChange={(v) => updateParam("Cw", v)}
                />
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Results */}
      <div className="mb-6">
        <Typography type="h2">Resultados</Typography>
        <Typography className="mt-1" color="muted" type="body-sm">
          Comparativa de escenarios para 1 y 2 servidores
        </Typography>
      </div>

      {/* Scenario Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {scenarios.map((scenario) => {
          const isBest = scenario.cost === bestCost;
          const isWorst = scenario.cost === worstCost && bestCost !== worstCost;

          return (
            <Card
              key={scenario.s}
              className={`transition-all duration-300 ${isBest
                  ? "ring-2 ring-success/50 shadow-lg shadow-success/10"
                  : isWorst
                    ? "opacity-75"
                    : ""
                }`}
              variant={isBest ? "tertiary" : "default"}
            >
              <Card.Header>
                <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                  <Chip color={isBest ? "success" : "default"}>
                    {scenario.s} Servidor{scenario.s > 1 ? "es" : ""}
                  </Chip>
                  {isBest && (
                    <Chip color="success" variant="primary">
                      <TrendingDown className="size-3 mr-1" />
                      Mejor Opcion
                    </Chip>
                  )}
                </div>
              </Card.Header>
              <Card.Content>
                <dl className="space-y-3">
                  {scenario.s === 1 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-muted">
                        P&#8320; (Prob. Sistema Vacio)
                      </dt>
                      <dd className="text-base font-semibold tabular-nums">
                        {formatDecimal(scenario.P0)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      L (Unidades en Sistema)
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {formatDecimal(scenario.L, 4)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Costo de Servidores
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {formatCurrency(scenario.s * params.Cs)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">
                      Costo de Espera
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {formatCurrency(scenario.L * params.Cw)}
                    </dd>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium">Costo Total</dt>
                    <dd
                      className={`text-xl font-bold tabular-nums ${isBest ? "text-success" : ""}`}
                    >
                      {formatCurrency(scenario.cost)}
                    </dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {/* Cost Comparison */}
      {scenarios.length === 2 && (
        <Card>
          <Card.Header>
            <Card.Title>Comparativa de Costos</Card.Title>
            <Card.Description>
              El escenario con menor costo total representa la decision
              economica optima
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-5">
              {scenarios.map((scenario) => {
                return (
                  <div key={scenario.s}>
                    <ProgressBar
                      color={
                        scenario.cost === bestCost ? "success" : "warning"
                      }
                      formatOptions={CURRENCY_FORMAT}
                      maxValue={worstCost || 1}
                      minValue={0}
                      size="lg"
                      value={scenario.cost}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Label>
                          {scenario.s} Servidor
                          {scenario.s > 1 ? "es" : ""}
                        </Label>
                        <ProgressBar.Output />
                      </div>
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                    <Typography
                      className="mt-1 text-right"
                      color="muted"
                      type="body-sm"
                    >
                      {formatCurrency(scenario.cost)}
                    </Typography>
                  </div>
                );
              })}
            </div>

            <Separator className="my-5" />

            {/* Savings Callout */}
            <div className="rounded-xl bg-success/10 border border-success/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-success/20 shrink-0">
                  <TrendingDown className="size-4.5 text-success" />
                </div>
                <div>
                  <Typography className="font-semibold text-sm" type="body">
                    Ahorro estimado: {formatCurrency(savings)}
                  </Typography>
                  <Typography className="text-xs" color="muted" type="body-sm">
                    Elegir la mejor opcion reduce los costos en{" "}
                    {formatPercent(savingsPercent)}. El costo de oportunidad de
                    una decision suboptima es significativo.
                  </Typography>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
