"use client";

import { Boxes, Clock, ArrowRight, TrendingUp, Users, DollarSign, Package, Percent, Calendar } from "lucide-react";
import { Card, Badge, Typography } from "@heroui/react";
import Link from "next/link";

interface ModuleCard {
  title: string;
  path: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

interface CategorySection {
  category: string;
  description: string;
  icon: React.ElementType;
  color: "accent" | "success";
  modules: ModuleCard[];
}

const CATEGORIES: CategorySection[] = [
  {
    category: "Modelos de Inventarios",
    description:
      "",
    icon: Boxes,
    color: "accent",
    modules: [
      {
        title: "Modelo EOQ",
        path: "/inventarios/eoq",
        description:
          "Calcula la cantidad economica de pedido que minimiza los costos totales de inventario.",
        icon: TrendingUp,
        badge: "Popular",
      },
      {
        title: "Descuento por Cantidad",
        path: "/inventarios/descuento",
        description:
          "Evalua si conviene aceptar descuentos por volumen considerando el costo de mantener inventario.",
        icon: Percent,
      },
      {
        title: "Periodo Unico",
        path: "/inventarios/periodo-unico",
        description:
          "Modelo para productos de temporada o perecederos donde la decision se toma una sola vez.",
        icon: Calendar,
      },
    ],
  },
  {
    category: "Lineas de Espera",
    description:
      "",
    icon: Clock,
    color: "success",
    modules: [
      {
        title: "Poblacion Finita",
        path: "/lineas-espera/poblacion-finita",
        description:
          "Cuando la fuente de clientes es limitada (ej. maquinas en una fabrica) y cada una puede fallar.",
        icon: Users,
        badge: "Disponible",
      },
      {
        title: "Poblacion Infinita",
        path: "/lineas-espera/poblacion-infinita",
        description:
          "Clientes llegan desde una fuente ilimitada. Analiza tiempos de espera y uso del sistema.",
        icon: DollarSign,
      },
      {
        title: "Multiples Canales",
        path: "/lineas-espera/multiples-canales",
        description:
          "Sistema con varios servidores en paralelo atendiendo una cola comun.",
        icon: Package,
      },
    ],
  },
];

function CategoryIconBadge({ icon: Icon, color }: { icon: React.ElementType; color: "accent" | "success" }) {
  return (
    <div
      className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${color === "accent"
        ? "bg-accent/15 text-accent"
        : "bg-success/15 text-success"
        }`}
    >
      <Icon className="size-5" />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-14">
      {/* Hero */}
      <header className="mb-12 text-center">
        <Typography type="h1" className="text-balance text-center">
          Investigacion de Operaciones
        </Typography>
      </header>

      {/* Categories */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <section key={cat.category} className="flex flex-col gap-4">
            {/* Category Header */}
            <div className="flex items-center gap-3">
              <CategoryIconBadge color={cat.color} icon={cat.icon} />
              <div>
                <Typography type="h3">{cat.category}</Typography>
                <Typography className="text-xs" color="muted" type="body-sm">
                  {cat.modules.length} modulos
                </Typography>
              </div>
            </div>

            <Typography className="text-sm leading-relaxed" color="muted" type="body">
              {cat.description}
            </Typography>

            {/* Module Cards */}
            <div className="flex flex-col gap-3">
              {cat.modules.map((mod) => (
                <Link
                  key={mod.path}
                  href={mod.path}
                  className="group block"
                >
                  <Card
                    variant="default"
                    className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                  >
                    <Card.Content>
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex size-9 items-center justify-center rounded-lg shrink-0 mt-0.5 ${cat.color === "accent"
                            ? "bg-accent/10 text-accent group-hover:bg-accent/20"
                            : "bg-success/10 text-success group-hover:bg-success/20"
                            } transition-colors`}
                        >
                          <mod.icon className="size-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Typography className="font-semibold text-sm" type="body">
                              {mod.title}
                            </Typography>
                            {mod.badge && (
                              <Badge
                                color={cat.color}
                                size="sm"
                                variant="soft"
                              >
                                {mod.badge}
                              </Badge>
                            )}
                          </div>
                          <Typography
                            className="mt-1 text-xs leading-relaxed line-clamp-2"
                            color="muted"
                            type="body-sm"
                          >
                            {mod.description}
                          </Typography>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-0.5" />
                      </div>
                    </Card.Content>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
