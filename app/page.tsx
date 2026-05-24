"use client";

import { useMemo, useState } from "react";
import { Badge } from "@heroui/react";
import { Card } from "@heroui/react";
import { Label } from "@heroui/react";
import { NumberField } from "@heroui/react";
import { ProgressBar } from "@heroui/react";
import { Separator } from "@heroui/react";
import { Typography } from "@heroui/react";
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

export default function Home() {
  const [params, setParams] = useState<QueueParams>(DEFAULT_PARAMS);

  const scenarios = useMemo(() => calculateScenarios(params), [params]);

  const bestCost = useMemo(
    () => Math.min(...scenarios.map((s) => s.cost)),
    [scenarios],
  );

  const maxCost = useMemo(
    () => Math.max(...scenarios.map((s) => s.cost)),
    [scenarios],
  );

  const updateParam = (key: keyof QueueParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="mb-10">
        <Typography type="h1">Teoria de Colas</Typography>
        <Typography className="mt-2" color="muted" type="body">
          Modelo de Poblacion Finita con Multiples Servidores &middot; Analisis
          y comparacion de costos
        </Typography>
      </header>

      {/* Parameters Card */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title>Parametros del Modelo</Card.Title>
          <Card.Description>
            Ajuste los valores para calcular los indicadores de desempeno y
            costos operativos
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              isRequired
              minValue={1}
              maxValue={100}
              name="N"
              step={1}
              value={params.N}
              onChange={(v) => updateParam("N", v)}
            >
              <Label>N &mdash; Poblacion Total</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <NumberField
              isRequired
              minValue={0.001}
              maxValue={100}
              name="lambda"
              step={0.01}
              value={params.lambda}
              onChange={(v) => updateParam("lambda", v)}
            >
              <Label>&lambda; &mdash; Tasa de Llegada</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <NumberField
              isRequired
              minValue={0.001}
              maxValue={100}
              name="mu"
              step={0.01}
              value={params.mu}
              onChange={(v) => updateParam("mu", v)}
            >
              <Label>&mu; &mdash; Tasa de Servicio</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <NumberField
              isRequired
              minValue={0}
              name="Cs"
              step={5000}
              value={params.Cs}
              formatOptions={CURRENCY_FORMAT}
              onChange={(v) => updateParam("Cs", v)}
            >
              <Label>Cs &mdash; Costo por Servidor</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <NumberField
              isRequired
              minValue={0}
              name="Cw"
              step={5000}
              value={params.Cw}
              formatOptions={CURRENCY_FORMAT}
              onChange={(v) => updateParam("Cw", v)}
            >
              <Label>Cw &mdash; Costo de Espera</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          </div>
        </Card.Content>
      </Card>

      <Separator className="my-8" />

      {/* Results Header */}
      <div className="mb-5">
        <Typography type="h2">Resultados</Typography>
        <Typography className="mt-1" color="muted" type="body-sm">
          Comparativa de escenarios para 1 y 2 mecanicos
        </Typography>
      </div>

      {/* Scenario Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {scenarios.map((scenario) => {
          const isBest = scenario.cost === bestCost;

          return (
            <Card
              key={scenario.s}
              variant={isBest ? "tertiary" : "default"}
            >
              <Card.Header>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="default">
                    {scenario.s} Mecanico{scenario.s > 1 ? "s" : ""}
                  </Badge>
                  {isBest && (
                    <Badge color="success">Mejor Opcion</Badge>
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
                  <Separator />
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted">Costo Total</dt>
                    <dd
                      className={`text-lg font-bold tabular-nums ${isBest ? "text-success" : ""}`}
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
              {scenarios.map((scenario) => (
                <ProgressBar
                  key={scenario.s}
                  color={scenario.cost === bestCost ? "success" : "warning"}
                  formatOptions={CURRENCY_FORMAT}
                  maxValue={maxCost}
                  minValue={0}
                  value={scenario.cost}
                >
                  <Label>
                    {scenario.s} Mecanico{scenario.s > 1 ? "s" : ""}
                  </Label>
                  <ProgressBar.Output />
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              ))}

              <Separator />

              <div className="text-center">
                <Typography color="muted" type="body-sm">
                  Ahorro estimado al elegir la mejor opcion:{" "}
                  <span className="font-semibold text-success">
                    {formatCurrency(maxCost - bestCost)}
                  </span>
                </Typography>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
