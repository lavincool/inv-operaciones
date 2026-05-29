/* ═══════════════════════════════════════════════════════════════════════════════
 *  Teoria de Colas — Motores de calculo para los 3 modelos
 *  - Un solo servidor (M/M/1)
 *  - Multiples servidores (M/M/s)
 *  - Fuente finita
 * ═══════════════════════════════════════════════════════════════════════════════ */

export type ModelType = "single-server" | "multi-server" | "finite-source";

export interface QueueTheoryInput {
  model: ModelType;
  lambda: number;
  mu: number;
  s?: number;
  nClientes?: number;
  poblacion?: number;
}

export interface QueueTheoryDesgloses {
  rho: string;
  P0: string;
  L: string;
  Lq: string;
  W: string;
  Wq: string;
  Pn?: string;
}

export interface QueueTheoryOutput {
  rho: number;
  P0: number;
  L: number;
  Lq: number;
  W: number;
  Wq: number;
  Pn?: number;
  desgloses: QueueTheoryDesgloses;
}

/* ── ayudantes ───────────────────────────────────────────────────────────── */

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

/* ═══════════════════════════════════════════════════════════════════════════════
 *  MODELO 1 — Un solo servidor (M/M/1)
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function calculateSingleServer(
  lambda: number,
  mu: number,
  nClientes?: number,
): QueueTheoryOutput {
  if (lambda <= 0) {
    throw new Error("La tasa de llegada (\u03BB) debe ser mayor a 0.");
  }
  if (mu <= 0) {
    throw new Error("La tasa de servicio (\u03BC) debe ser mayor a 0.");
  }
  if (lambda >= mu) {
    throw new Error(
      `El sistema es inestable. La tasa de llegada (\u03BB = ${fmt(lambda)}) debe ser ` +
        `menor que la tasa de servicio (\u03BC = ${fmt(mu)}). ` +
        "Aumente \u03BC, reduzca \u03BB o considere el modelo de multiples servidores.",
    );
  }

  const rho = lambda / mu;
  const P0 = 1 - rho;
  const L = lambda / (mu - lambda);
  const Lq = rho * L;
  const W = 1 / (mu - lambda);
  const Wq = rho * W;

  /* ---- Pn opcional ---- */
  let Pn: number | undefined;
  let desglosePn: string | undefined;

  if (nClientes !== undefined && nClientes >= 0 && Number.isInteger(nClientes)) {
    Pn = (1 - rho) * Math.pow(rho, nClientes);
    desglosePn =
      `P_{${nClientes}} = (1 - \\rho) \\cdot \\rho^{${nClientes}} ` +
      `= (1 - ${fmt(rho)}) \\cdot ${fmt(rho)}^{${nClientes}} ` +
      `= ${fmt(P0)} \\cdot ${fmt(Math.pow(rho, nClientes))} = ${fmt(Pn)}`;
  }

  const desgloses: QueueTheoryDesgloses = {
    rho: `\\rho = \\frac{\\lambda}{\\mu} = \\frac{${fmt(lambda)}}{${fmt(mu)}} = ${fmt(rho)}`,
    P0: `P_0 = 1 - \\rho = 1 - ${fmt(rho)} = ${fmt(P0)}`,
    L: `L = \\frac{\\lambda}{\\mu - \\lambda} = \\frac{${fmt(lambda)}}{${fmt(mu)} - ${fmt(lambda)}} = ${fmt(L)}`,
    Lq: `L_q = \\rho \\cdot L = ${fmt(rho)} \\cdot ${fmt(L)} = ${fmt(Lq)}`,
    W: `W = \\frac{1}{\\mu - \\lambda} = \\frac{1}{${fmt(mu)} - ${fmt(lambda)}} = ${fmt(W)}`,
    Wq: `W_q = \\rho \\cdot W = ${fmt(rho)} \\cdot ${fmt(W)} = ${fmt(Wq)}`,
    Pn: desglosePn,
  };

  return { rho, P0, L, Lq, W, Wq, Pn, desgloses };
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  MODELO 2 — Multiples servidores (M/M/s)
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function calculateMultiServer(
  lambda: number,
  mu: number,
  s: number,
  nClientes?: number,
): QueueTheoryOutput {
  if (lambda <= 0) {
    throw new Error("La tasa de llegada (\u03BB) debe ser mayor a 0.");
  }
  if (mu <= 0) {
    throw new Error("La tasa de servicio (\u03BC) debe ser mayor a 0.");
  }
  if (s < 1 || !Number.isInteger(s)) {
    throw new Error("El numero de servidores (s) debe ser un entero \u2265 1.");
  }

  const rho = lambda / (s * mu);

  if (rho >= 1) {
    throw new Error(
      `El sistema es inestable. El factor de utilizacion (\u03C1 = ${fmt(rho)}) debe ser < 1. ` +
        "Aumente s, reduzca \u03BB o aumente \u03BC.",
    );
  }

  const lambdaOverMu = lambda / mu;

  /* ---- P0 ---- */
  let sum = 0;
  for (let i = 0; i <= s - 1; i++) {
    sum += Math.pow(lambdaOverMu, i) / factorial(i);
  }
  const lastTerm =
    (Math.pow(lambdaOverMu, s) / factorial(s)) * (1 / (1 - rho));

  const P0 = 1 / (sum + lastTerm);

  /* ---- Lq ---- */
  const Lq =
    (P0 * Math.pow(lambdaOverMu, s) * rho) /
    (factorial(s) * Math.pow(1 - rho, 2));

  /* ---- Wq, W, L ---- */
  const Wq = Lq / lambda;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  /* ---- Pn opcional ---- */
  let Pn: number | undefined;
  let desglosePn: string | undefined;

  if (nClientes !== undefined && nClientes >= 0 && Number.isInteger(nClientes)) {
    if (nClientes === 0) {
      Pn = P0;
      desglosePn = `P_0 = ${fmt(P0)}`;
    } else if (nClientes < s) {
      Pn = (Math.pow(lambdaOverMu, nClientes) / factorial(nClientes)) * P0;
      desglosePn =
        `P_{${nClientes}} = \\frac{(\\lambda/\\mu)^{${nClientes}}}{${nClientes}!} \\cdot P_0 ` +
        `= \\frac{${fmt(Math.pow(lambdaOverMu, nClientes))}}{${factorial(nClientes)}} \\cdot ${fmt(P0)} ` +
        `= ${fmt(Pn)}`;
    } else {
      Pn =
        (Math.pow(lambdaOverMu, nClientes) /
          (factorial(s) * Math.pow(s, nClientes - s))) *
        P0;
      desglosePn =
        `P_{${nClientes}} = \\frac{(\\lambda/\\mu)^{${nClientes}}}{${s}! \\cdot ${s}^{${nClientes - s}}} \\cdot P_0 ` +
        `= ${fmt(Pn)}`;
    }
  }

  /* ---- Desgloses LaTeX ---- */
  let sumTerms = "";
  for (let i = 0; i <= s - 1; i++) {
    if (i === 0) {
      sumTerms += "1";
    } else if (i === 1) {
      sumTerms += ` + \\frac{${fmt(lambdaOverMu)}}{1!}`;
    } else {
      sumTerms += ` + \\frac{(${fmt(lambdaOverMu)})^{${i}}}{${i}!}`;
    }
  }

  const partialSumStr = fmt(sum);
  const lastTermStr = fmt(lastTerm);

  const desgloses: QueueTheoryDesgloses = {
    rho: `\\rho = \\frac{\\lambda}{s \\cdot \\mu} = \\frac{${fmt(lambda)}}{${s} \\cdot ${fmt(mu)}} = ${fmt(rho)}`,
    P0:
      `P_0 = \\left[ \\sum_{n=0}^{${s - 1}} \\frac{(\\lambda/\\mu)^n}{n!} + \\frac{(\\lambda/\\mu)^{${s}}}{${s}!(1-\\rho)} \\right]^{-1} \\\\` +
      `P_0 = \\left[ ${sumTerms} + \\frac{(${fmt(lambdaOverMu)})^{${s}}}{${s}!(1-${fmt(rho)})} \\right]^{-1} \\\\` +
      `P_0 = \\left[ ${partialSumStr} + ${lastTermStr} \\right]^{-1} = ${fmt(P0)}`,
    L: `L = \\lambda \\cdot W = ${fmt(lambda)} \\cdot ${fmt(W)} = ${fmt(L)}`,
    Lq: `L_q = \\frac{P_0 (\\lambda/\\mu)^{${s}} \\rho}{${s}! (1-\\rho)^2} = \\frac{${fmt(P0)} \\cdot (${fmt(lambdaOverMu)})^{${s}} \\cdot ${fmt(rho)}}{${s}! \\cdot (${fmt(1 - rho)})^2} = ${fmt(Lq)}`,
    W: `W = W_q + \\frac{1}{\\mu} = ${fmt(Wq)} + \\frac{1}{${fmt(mu)}} = ${fmt(W)}`,
    Wq: `W_q = \\frac{L_q}{\\lambda} = \\frac{${fmt(Lq)}}{${fmt(lambda)}} = ${fmt(Wq)}`,
    Pn: desglosePn,
  };

  return { rho, P0, L, Lq, W, Wq, Pn, desgloses };
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  MODELO 3 — Fuente finita
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function calculateFiniteSource(
  lambda: number,
  mu: number,
  N: number,
): QueueTheoryOutput {
  if (lambda <= 0) {
    throw new Error("La tasa de llegada (\u03BB) debe ser mayor a 0.");
  }
  if (mu <= 0) {
    throw new Error("La tasa de servicio (\u03BC) debe ser mayor a 0.");
  }
  if (N < 1 || !Number.isInteger(N)) {
    throw new Error("El tamano de la poblacion (N) debe ser un entero \u2265 1.");
  }

  const lambdaOverMu = lambda / mu;

  /* ---- P0: sumatoria iterativa para evitar overflow factorial ---- */
  let sum = 0;
  let term = 1; // n=0
  for (let n = 0; n <= N; n++) {
    sum += term;
    if (n < N) {
      term *= (N - n) * lambdaOverMu;
    }
  }
  const P0 = 1 / sum;

  /* ---- rho, L, Lq ---- */
  const rho = 1 - P0;
  const L = N - (mu / lambda) * (1 - P0);
  const Lq = N - ((lambda + mu) / lambda) * (1 - P0);

  /* ---- W, Wq ---- */
  const denominador = (N - L) * lambda;
  if (denominador <= 0) {
    throw new Error(
      "Error en el calculo de W y Wq: denominador (N\u2212L)\u00B7\u03BB \u2264 0. " +
        "Verifique los parametros de entrada.",
    );
  }
  const W = L / denominador;
  const Wq = Lq / denominador;

  /* ---- Desgloses LaTeX ---- */
  const desgloses: QueueTheoryDesgloses = {
    rho: `\\rho = 1 - P_0 = 1 - ${fmt(P0)} = ${fmt(rho)}`,
    P0: `P_0 = \\left[ \\sum_{n=0}^{${N}} \\frac{${N}!}{(${N}-n)!} \\cdot \\left(\\frac{\\lambda}{\\mu}\\right)^n \\right]^{-1} = ${fmt(P0)}`,
    L: `L = ${N} - \\frac{\\mu}{\\lambda} \\cdot (1 - P_0) = ${N} - \\frac{${fmt(mu)}}{${fmt(lambda)}} \\cdot ${fmt(1 - P0)} = ${fmt(L)}`,
    Lq: `L_q = ${N} - \\frac{\\lambda + \\mu}{\\lambda} \\cdot (1 - P_0) = ${N} - \\frac{${fmt(lambda + mu)}}{${fmt(lambda)}} \\cdot ${fmt(1 - P0)} = ${fmt(Lq)}`,
    W: `W = \\frac{L}{(N - L) \\cdot \\lambda} = \\frac{${fmt(L)}}{(${N} - ${fmt(L)}) \\cdot ${fmt(lambda)}} = ${fmt(W)}`,
    Wq: `W_q = \\frac{L_q}{(N - L) \\cdot \\lambda} = \\frac{${fmt(Lq)}}{(${N} - ${fmt(L)}) \\cdot ${fmt(lambda)}} = ${fmt(Wq)}`,
  };

  return { rho, P0, L, Lq, W, Wq, desgloses };
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  Funcion unificada
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function calculateQueueTheory(input: QueueTheoryInput): QueueTheoryOutput {
  const { model, lambda, mu, s, nClientes, poblacion } = input;

  switch (model) {
    case "single-server":
      return calculateSingleServer(lambda, mu, nClientes);

    case "multi-server":
      if (s === undefined) {
        throw new Error(
          "El numero de servidores (s) es requerido para el modelo de multiples servidores.",
        );
      }
      return calculateMultiServer(lambda, mu, s, nClientes);

    case "finite-source":
      if (poblacion === undefined) {
        throw new Error(
          "El tamano de la poblacion (N) es requerido para el modelo de fuente finita.",
        );
      }
      return calculateFiniteSource(lambda, mu, poblacion);

    default:
      throw new Error("Modelo no reconocido.");
  }
}
