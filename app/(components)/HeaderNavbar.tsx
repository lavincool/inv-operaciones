"use client";

import { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
  DropdownPopover,
} from "@heroui/react";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Boxes,
  Clock,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import "./HeaderNavbar.css";

interface NavItem {
  title: string;
  path: string;
}

interface NavCategory {
  category: string;
  icon: React.ElementType;
  items: NavItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    category: "Inventarios",
    icon: Boxes,
    items: [
      { title: "Modelo EOQ", path: "/inventarios/eoq" },
      { title: "Descuento por Cantidad", path: "/inventarios/descuento" },
      { title: "Periodo Único", path: "/inventarios/periodo-unico" },
    ],
  },
  {
    category: "Líneas de Espera",
    icon: Clock,
    items: [
      { title: "Población Finita", path: "/lineas-espera/poblacion-finita" },
      { title: "Población Infinita", path: "/lineas-espera/poblacion-infinita" },
      { title: "Múltiples Canales", path: "/lineas-espera/multiples-canales" },
    ],
  },
];

export default function HeaderNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = () => setIsMenuOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl shadow-sm border-b border-default-100"
          : "bg-background border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center">
        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-default-100 transition-colors shrink-0"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>

        {/* Brand */}
        <Link
          href="/"
          className="navbar_brand font-bold text-lg tracking-tight hover:opacity-80 transition-opacity shrink-0"
          aria-label="Inv. Operaciones - Inicio"
        >
          Inv. Operaciones
        </Link>

        {/* Desktop nav dropdowns */}
        <div className="hidden sm:flex items-center gap-1 ml-8">
          {NAV_CATEGORIES.map((cat) => (
            <Dropdown key={cat.category}>
              <DropdownTrigger
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  cat.items.some((item) => isActive(item.path))
                    ? "text-accent bg-accent/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-default-100"
                }`}
              >
                <cat.icon className="size-4" />
                <span>{cat.category}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </DropdownTrigger>
              <DropdownPopover placement="bottom start" className="min-w-[220px]">
                <DropdownMenu
                  aria-label={cat.category}
                  onAction={(key) => router.push(key as string)}
                >
                  {cat.items.map((item) => (
                    <DropdownItem
                      key={item.path}
                      id={item.path}
                      textValue={item.title}
                      className={isActive(item.path) ? "text-accent" : ""}
                    >
                      {item.title}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </DropdownPopover>
            </Dropdown>
          ))}
        </div>

        {/* Spacer for mobile brand centering symmetry */}
        <div className="sm:hidden w-8 shrink-0" />
      </nav>

      {/* Mobile menu overlay + panel */}
      {isMenuOpen && (
        <div className="sm:hidden fixed inset-0 top-14 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-background border-t border-default-100 shadow-2xl animate-in slide-in-from-top-2 duration-300">
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_CATEGORIES.map((cat) => {
                const isExpanded = expandedCategory === cat.category;
                const hasActiveChild = cat.items.some((item) =>
                  isActive(item.path),
                );

                return (
                  <div key={cat.category}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.category)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        hasActiveChild
                          ? "bg-accent/10 text-accent"
                          : "text-foreground/70 hover:bg-default-100 hover:text-foreground"
                      }`}
                    >
                      <cat.icon
                        className={`size-4.5 shrink-0 ${
                          hasActiveChild ? "text-accent" : "text-muted"
                        }`}
                      />
                      <span className="flex-1 text-left">{cat.category}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        } ${hasActiveChild ? "text-accent" : "text-muted/40"}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="ml-7 mt-1 flex flex-col gap-0.5">
                        {cat.items.map((item) => {
                          const active = isActive(item.path);
                          return (
                            <Link
                              key={item.path}
                              href={item.path}
                              onClick={() => setIsMenuOpen(false)}
                              className={`flex items-center gap-3 pl-6 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                active
                                  ? "bg-accent/10 text-accent"
                                  : "text-foreground/60 hover:bg-default-100 hover:text-foreground"
                              }`}
                            >
                              <span className="flex-1">{item.title}</span>
                              {active && (
                                <ChevronRight className="size-4 shrink-0 text-accent" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
