"use client";

import { Boxes, Clock, ArrowRight, ShoppingCart, Factory, AlertTriangle, Percent, PieChart, Gauge, Timer, Hash, Users, ScanLine } from "lucide-react";
import { Card, Typography } from "@heroui/react";
import Link from "next/link";

const CATEGORIES = [
  {
    title: "Modelos de Inventarios",
    description: "Cinco modelos clasicos para la gestion optima de inventarios: EOQ basico, produccion interna, escasez permitida, descuentos por cantidad y modelo probabilistico con stock de seguridad.",
    icon: Boxes,
    href: "/nuevo/inventarios",
    color: "accent" as const,
    models: [
      { name: "Compra Economica (EOQ)", icon: ShoppingCart },
      { name: "Produccion Interna (EPQ)", icon: Factory },
      { name: "Con Escasez Permitida", icon: AlertTriangle },
      { name: "Descuentos por Cantidad", icon: Percent },
      { name: "Probabilistico (Stock Seg.)", icon: PieChart },
    ],
  },
  {
    title: "Teoria de Colas",
    description: "Cuatro modelos de lineas de espera probabilisticas: M/M/1 simple, servicio constante M/C/1, capacidad limitada M/M/1/N y multiples servidores M/M/S.",
    icon: Clock,
    href: "/nuevo/colas",
    color: "success" as const,
    models: [
      { name: "M/M/1 — Cola Simple", icon: Gauge },
      { name: "M/C/1 — Servicio Constante", icon: Timer },
      { name: "M/M/1/N — Capacidad Limitada", icon: Hash },
      { name: "M/M/S — Multiples Servidores", icon: Users },
    ],
  },
];

export default function NuevoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-14">
      <header className="mb-10 text-center">
        <Typography type="h1" className="mb-3">
          Sistema de Modelos de Inv. Operaciones
        </Typography>
        <Typography className="mx-auto max-w-xl" color="muted" type="body">
          Implementacion mejorada con formulas originales y diseno moderno. Seleccione una categoria para comenzar.
        </Typography>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link key={cat.href} href={cat.href} className="group block">
            <Card
              className={`relative overflow-hidden border-2 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl cursor-pointer ${
                cat.color === "accent"
                  ? "border-accent/30 hover:border-accent/60 group-hover:shadow-accent/10"
                  : "border-success/30 hover:border-success/60 group-hover:shadow-success/10"
              }`}
            >
              <div
                className={`absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.06] ${
                  cat.color === "accent" ? "bg-accent" : "bg-success"
                }`}
              />

              <Card.Header>
                <div className="flex items-center gap-4 w-full">
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${
                      cat.color === "accent"
                        ? "bg-accent/15 text-accent"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    <cat.icon className="size-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Card.Title className="text-xl">{cat.title}</Card.Title>
                    <Card.Description className="mt-1 line-clamp-2 text-sm leading-relaxed">
                      {cat.description}
                    </Card.Description>
                  </div>
                  <ArrowRight className={`size-5 shrink-0 transition-all group-hover:translate-x-1 ${
                    cat.color === "accent" ? "text-accent" : "text-success"
                  }`} />
                </div>
              </Card.Header>

              <Card.Content>
                <div className="flex flex-wrap gap-2">
                  {cat.models.map((m) => (
                    <div
                      key={m.name}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        cat.color === "accent"
                          ? "bg-accent/10 text-accent"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      <m.icon className="size-3" />
                      {m.name}
                    </div>
                  ))}
                </div>
              </Card.Content>

              <Card.Footer className="flex justify-end">
                <div
                  className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                    cat.color === "accent"
                      ? "text-accent group-hover:text-accent"
                      : "text-success group-hover:text-success"
                  }`}
                >
                  Explorar modelos
                  <ArrowRight className="size-3.5" />
                </div>
              </Card.Footer>
            </Card>
          </Link>
        ))}
      </div>

      {/* Scanner CTA */}
      <div className="mt-10">
        <Link href="/scanner" className="group block">
          <Card className="relative overflow-hidden border-2 border-primary/30 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:border-primary/60 group-hover:shadow-primary/10 cursor-pointer">
            <div className="absolute inset-0 opacity-[0.03] bg-primary transition-opacity group-hover:opacity-[0.06]" />
            <Card.Content className="py-6">
              <div className="flex items-center gap-5">
                <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-primary/15 text-primary transition-transform group-hover:scale-110">
                  <ScanLine className="size-8" />
                </div>
                <div className="flex-1">
                  <Typography type="h3" className="mb-1">Escáner de Problemas</Typography>
                  <Typography color="muted" type="body-sm" className="line-clamp-2">
                    Toma una foto de cualquier problema de investigación de operaciones. El sistema identifica automáticamente el modelo, extrae los parámetros y calcula los resultados. Compatible con los 9 modelos de inventarios y colas.
                  </Typography>
                </div>
                <ArrowRight className="size-6 shrink-0 text-primary transition-all group-hover:translate-x-1" />
              </div>
            </Card.Content>
          </Card>
        </Link>
      </div>
    </div>
  );
}
