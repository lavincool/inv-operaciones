// ══════════════════════════════════════════════════════════════════════════════
//  TEORIA DE COLAS — 4 modelos con formulas del sistema original
//  Basado en example_code/3/calculos_colas.py y sus modelos correspondientes
// ══════════════════════════════════════════════════════════════════════════════

/* ── Utilidades ─────────────────────────────────────────────────────────── */

function fmt(value: number, decimals = 4): string {
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/* ── Unidades ───────────────────────────────────────────────────────────── */

export type UnidadTiempo = "minuto" | "hora";
export type TipoEntrada = "cliente_tiempo" | "tiempo_cliente";

export interface UnitConfig {
  lambdaUnit: UnidadTiempo;
  muUnit: UnidadTiempo;
  lambdaType: TipoEntrada;
  muType: TipoEntrada;
}

/**
 * Convierte las tasas de llegada y servicio a una base comun (por hora, clientes/hora).
 * Si las unidades de λ y μ difieren, convierte minutos a horas.
 * Si el tipo es "tiempo_cliente", invierte para obtener clientes/tiempo.
 */
export function convertirUnidades(
  lambdaVal: number,
  muVal: number,
  config: UnitConfig,
): { lambda: number; mu: number } {
  let lambda = lambdaVal;
  let mu = muVal;

  // Conversion de minutos a horas
  if (config.lambdaUnit === "minuto" && config.muUnit === "hora") {
    lambda = lambda * 60;
  } else if (config.lambdaUnit === "hora" && config.muUnit === "minuto") {
    mu = mu * 60;
  }

  // Conversion de tipo: tiempo/cliente -> clientes/tiempo
  if (config.lambdaType === "tiempo_cliente" && lambda !== 0) {
    lambda = 1 / lambda;
  }
  if (config.muType === "tiempo_cliente" && mu !== 0) {
    mu = 1 / mu;
  }

  return { lambda, mu };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 1 — M/M/1: Cola Simple con un Servidor
 * ════════════════════════════════════════════════════════════════════════════ */

export interface MM1Input {
  lambda: number;
  mu: number;
  n: number;
  cs: number;
  ce: number;
  unitConfig: UnitConfig;
}

export interface MM1Desgloses {
  P: string;
  Pn: string;
  P0: string;
  L: string;
  Lq: string;
  W: string;
  Wq: string;
  CT: string;
}

export interface MM1Output {
  P: number;
  Pn: number;
  P0: number;
  L: number;
  Lq: number;
  W: number;
  Wq: number;
  CT: number;
  lambdaConv: number;
  muConv: number;
  desgloses: MM1Desgloses;
}

export function calculateMM1(input: MM1Input): MM1Output {
  const { lambda: lambdaRaw, mu: muRaw, n, cs, ce, unitConfig } = input;
  const { lambda, mu } = convertirUnidades(lambdaRaw, muRaw, unitConfig);

  if (lambda <= 0 || mu <= 0) throw new Error("λ y μ deben ser mayores a cero.");
  if (lambda >= mu) throw new Error(`El sistema no es estable: ρ = ${fmt(lambda/mu)} >= 1. Debe cumplirse λ < μ.`);

  const P = lambda / mu;
  const P0 = 1 - P;
  const Pn = (1 - P) * Math.pow(P, n);
  const L = lambda / (mu - lambda);
  const Lq = P * L;
  const W = 1 / (mu - lambda);
  const Wq = P * W;
  const CT = cs + ce * Lq;

  const desgloses: MM1Desgloses = {
    P: `\\rho = \\frac{\\lambda}{\\mu} = \\frac{${fmt(lambda)}}{${fmt(mu)}} = ${fmt(P)}`,
    Pn: `P_{${n}} = (1 - \\rho) \\cdot \\rho^{${n}} = (1 - ${fmt(P)}) \\cdot ${fmt(P)}^{${n}} = ${fmt(Pn, 6)}`,
    P0: `P_0 = 1 - \\rho = 1 - ${fmt(P)} = ${fmt(P0)}`,
    L: `L = \\frac{\\lambda}{\\mu - \\lambda} = \\frac{${fmt(lambda)}}{${fmt(mu)} - ${fmt(lambda)}} = ${fmt(L)}`,
    Lq: `L_q = \\rho \\cdot L = ${fmt(P)} \\cdot ${fmt(L)} = ${fmt(Lq)}`,
    W: `W = \\frac{1}{\\mu - \\lambda} = \\frac{1}{${fmt(mu)} - ${fmt(lambda)}} = ${fmt(W)}`,
    Wq: `W_q = \\rho \\cdot W = ${fmt(P)} \\cdot ${fmt(W)} = ${fmt(Wq)}`,
    CT: `CT = c_s + c_e \\cdot L_q = ${cs} + ${ce} \\cdot ${fmt(Lq)} = \\$${fmt(CT)}`,
  };

  return { P, Pn, P0, L, Lq, W, Wq, CT, lambdaConv: lambda, muConv: mu, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 2 — M/C/1: Cola con Servicio Constante (Deterministico)
 * ════════════════════════════════════════════════════════════════════════════ */

export interface MC1Input {
  lambda: number;
  mu: number;
  cs: number;
  ce: number;
  unitConfig: UnitConfig;
}

export interface MC1Desgloses {
  P: string;
  P0: string;
  L: string;
  Lq: string;
  W: string;
  Wq: string;
  CT: string;
}

export interface MC1Output {
  P: number;
  P0: number;
  L: number;
  Lq: number;
  W: number;
  Wq: number;
  CT: number;
  lambdaConv: number;
  muConv: number;
  desgloses: MC1Desgloses;
}

export function calculateMC1(input: MC1Input): MC1Output {
  const { lambda: lambdaRaw, mu: muRaw, cs, ce, unitConfig } = input;
  const { lambda, mu } = convertirUnidades(lambdaRaw, muRaw, unitConfig);

  if (lambda <= 0 || mu <= 0) throw new Error("λ y μ deben ser mayores a cero.");
  if (lambda >= mu) throw new Error(`El sistema no es estable: ρ = ${fmt(lambda/mu)} >= 1.`);

  const P = lambda / mu;
  const P0 = 1 - P;
  const Lq = (lambda * lambda) / (2 * mu * (mu - lambda));
  const L = Lq + P;
  const Wq = Lq / lambda;
  const W = Wq + (1 / mu);
  const CT = cs + ce * Lq;

  const desgloses: MC1Desgloses = {
    P: `\\rho = \\frac{\\lambda}{\\mu} = \\frac{${fmt(lambda)}}{${fmt(mu)}} = ${fmt(P)}`,
    P0: `P_0 = 1 - \\rho = 1 - ${fmt(P)} = ${fmt(P0)}`,
    L: `L = L_q + \\rho = ${fmt(Lq)} + ${fmt(P)} = ${fmt(L)}`,
    Lq: `L_q = \\frac{\\lambda^2}{2 \\cdot \\mu \\cdot (\\mu - \\lambda)} = \\frac{${fmt(lambda)}^2}{2 \\cdot ${fmt(mu)} \\cdot (${fmt(mu)} - ${fmt(lambda)})} = ${fmt(Lq)}`,
    W: `W = W_q + \\frac{1}{\\mu} = ${fmt(Wq)} + \\frac{1}{${fmt(mu)}} = ${fmt(W)}`,
    Wq: `W_q = \\frac{L_q}{\\lambda} = \\frac{${fmt(Lq)}}{${fmt(lambda)}} = ${fmt(Wq)}`,
    CT: `CT = c_s + c_e \\cdot L_q = ${cs} + ${ce} \\cdot ${fmt(Lq)} = \\$${fmt(CT)}`,
  };

  return { P, P0, L, Lq, W, Wq, CT, lambdaConv: lambda, muConv: mu, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 3 — M/M/1/N: Cola con Capacidad Limitada
 * ════════════════════════════════════════════════════════════════════════════ */

export interface MM1NInput {
  lambda: number;
  mu: number;
  capacidad: number;
  cs: number;
  ce: number;
  unitConfig: UnitConfig;
}

export interface MM1NDesgloses {
  P: string;
  P0: string;
  L: string;
  Lq: string;
  W: string;
  Wq: string;
  CT: string;
}

export interface MM1NOutput {
  P: number;
  P0: number;
  L: number;
  Lq: number;
  W: number;
  Wq: number;
  CT: number;
  capacidadUtilizada: number;
  lambdaConv: number;
  muConv: number;
  desgloses: MM1NDesgloses;
}

export function calculateMM1N(input: MM1NInput): MM1NOutput {
  const { lambda: lambdaRaw, mu: muRaw, capacidad, cs, ce, unitConfig } = input;
  const { lambda, mu } = convertirUnidades(lambdaRaw, muRaw, unitConfig);

  if (lambda <= 0 || mu <= 0 || capacidad <= 0) throw new Error("λ, μ y N deben ser mayores a cero.");
  if (capacidad < 1) throw new Error("La capacidad N debe ser al menos 1.");

  const N = Math.round(capacidad);

  // Calcular P0 via sumatoria
  let sumP0 = 0;
  for (let i = 0; i <= N; i++) {
    try {
      const termino = (factorial(N) / factorial(N - i)) * Math.pow(lambda / mu, i);
      sumP0 += termino;
    } catch {
      continue;
    }
  }

  if (sumP0 === 0) throw new Error("Error en calculo de P0: sumatoria dio cero.");

  const P0 = 1 / sumP0;
  const Rho = 1 - P0;
  const Lq = N - ((lambda + mu) / lambda) * (1 - P0);
  const L = N - (mu / lambda) * (1 - P0);

  const denom = (N - L) * lambda;
  const W = denom !== 0 ? L / denom : 0;
  const Wq = denom !== 0 ? Lq / denom : 0;

  const CT = cs + ce * L;
  const capacidadUtilizada = N > 0 ? (L / N) * 100 : 0;

  const desgloses: MM1NDesgloses = {
    P: `\\rho = 1 - P_0 = 1 - ${fmt(P0, 6)} = ${fmt(Rho)}`,
    P0: `P_0 = \\left[\\sum_{i=0}^{${N}} \\frac{N!}{(N-i)!} \\cdot \\left(\\frac{\\lambda}{\\mu}\\right)^i\\right]^{-1} = ${fmt(P0, 6)}`,
    L: `L = N - \\frac{\\mu}{\\lambda} \\cdot (1 - P_0) = ${N} - \\frac{${fmt(mu)}}{${fmt(lambda)}} \\cdot ${fmt(1 - P0)} = ${fmt(L)}`,
    Lq: `L_q = N - \\frac{\\lambda + \\mu}{\\lambda} \\cdot (1 - P_0) = ${N} - \\frac{${fmt(lambda + mu)}}{${fmt(lambda)}} \\cdot ${fmt(1 - P0)} = ${fmt(Lq)}`,
    W: `W = \\frac{L}{(N - L) \\cdot \\lambda} = \\frac{${fmt(L)}}{(${N} - ${fmt(L)}) \\cdot ${fmt(lambda)}} = ${fmt(W)}`,
    Wq: `W_q = \\frac{L_q}{(N - L) \\cdot \\lambda} = \\frac{${fmt(Lq)}}{(${N} - ${fmt(L)}) \\cdot ${fmt(lambda)}} = ${fmt(Wq)}`,
    CT: `CT = c_s + c_e \\cdot L = ${cs} + ${ce} \\cdot ${fmt(L)} = \\$${fmt(CT)}`,
  };

  return { P: Rho, P0, L, Lq, W, Wq, CT, capacidadUtilizada, lambdaConv: lambda, muConv: mu, desgloses };
}

/* ════════════════════════════════════════════════════════════════════════════
 *  MODELO 4 — M/M/S: Cola con Multiples Servidores
 * ════════════════════════════════════════════════════════════════════════════ */

export interface MMSInput {
  lambda: number;
  mu: number;
  servidores: number;
  n: number;
  cs: number;
  ce: number;
  unitConfig: UnitConfig;
}

export interface MMSDesgloses {
  P: string;
  Pn: string;
  P0: string;
  L: string;
  Lq: string;
  W: string;
  Wq: string;
  CT: string;
}

export interface MMSOutput {
  P: number;
  Pn: number;
  P0: number;
  L: number;
  Lq: number;
  W: number;
  Wq: number;
  CT: number;
  servidoresActivos: number;
  lambdaConv: number;
  muConv: number;
  desgloses: MMSDesgloses;
}

export function calculateMMS(input: MMSInput): MMSOutput {
  const { lambda: lambdaRaw, mu: muRaw, servidores, n, cs, ce, unitConfig } = input;
  const { lambda, mu } = convertirUnidades(lambdaRaw, muRaw, unitConfig);

  if (lambda <= 0 || mu <= 0 || servidores <= 0) throw new Error("λ, μ y S deben ser mayores a cero.");
  if (servidores < 1) throw new Error("Debe haber al menos 1 servidor.");

  const S = Math.round(servidores);
  const Rho = lambda / (S * mu);

  if (Rho >= 1) throw new Error(`El sistema no es estable: ρ = ${fmt(Rho)} >= 1. Debe cumplirse λ < S·μ.`);

  // P0 via sumatoria
  let sumP0 = 0;
  for (let i = 0; i < S; i++) {
    try {
      sumP0 += Math.pow(lambda / mu, i) / factorial(i);
    } catch {
      continue;
    }
  }

  let P0 = 0;
  try {
    const lastTerm = (Math.pow(lambda / mu, S) / factorial(S)) * (1 / (1 - Rho));
    P0 = 1 / (sumP0 + lastTerm);
  } catch {
    P0 = 0;
  }

  // Pn
  let Pn = 0;
  if (P0 !== 0) {
    if (n > 0 && n < S) {
      try {
        Pn = (Math.pow(lambda / mu, n) / factorial(n)) * P0;
      } catch {
        Pn = 0;
      }
    } else if (n >= S) {
      try {
        Pn = (Math.pow(lambda / mu, n) / (factorial(S) * Math.pow(S, n - S))) * P0;
      } catch {
        Pn = 0;
      }
    }
  }

  // Lq
  let Lq = 0;
  try {
    Lq = (P0 * Math.pow(lambda / mu, S) * Rho) / (factorial(S) * Math.pow(1 - Rho, 2));
  } catch {
    Lq = 0;
  }

  const Wq = lambda !== 0 ? Lq / lambda : 0;
  const W = Wq + (1 / mu);
  const L = lambda * W;
  const CT = cs + ce * L;
  const servidoresActivos = L - Lq;

  const desgloses: MMSDesgloses = {
    P: `\\rho = \\frac{\\lambda}{S \\cdot \\mu} = \\frac{${fmt(lambda)}}{${S} \\cdot ${fmt(mu)}} = ${fmt(Rho)}`,
    Pn: n === 0
      ? `P_0 = ${fmt(P0, 6)}`
      : `P_{${n}} = ${fmt(Pn, 6)}`,
    P0: `P_0 = \\left[\\sum_{i=0}^{${S-1}}\\frac{(\\lambda/\\mu)^i}{i!} + \\frac{(\\lambda/\\mu)^{${S}}}{${S}!(1-\\rho)}\\right]^{-1} = ${fmt(P0, 6)}`,
    L: `L = \\lambda \\cdot W = ${fmt(lambda)} \\cdot ${fmt(W)} = ${fmt(L)}`,
    Lq: `L_q = \\frac{P_0 \\cdot (\\lambda/\\mu)^{${S}} \\cdot \\rho}{${S}! \\cdot (1-\\rho)^2} = ${fmt(Lq)}`,
    W: `W = W_q + \\frac{1}{\\mu} = ${fmt(Wq)} + \\frac{1}{${fmt(mu)}} = ${fmt(W)}`,
    Wq: `W_q = \\frac{L_q}{\\lambda} = \\frac{${fmt(Lq)}}{${fmt(lambda)}} = ${fmt(Wq)}`,
    CT: `CT = c_s + c_e \\cdot L = ${cs} + ${ce} \\cdot ${fmt(L)} = \\$${fmt(CT)}`,
  };

  return { P: Rho, Pn, P0, L, Lq, W, Wq, CT, servidoresActivos, lambdaConv: lambda, muConv: mu, desgloses };
}
