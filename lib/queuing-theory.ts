export interface QueueParams {
  N: number;
  lambda: number;
  mu: number;
  Cs: number;
  Cw: number;
}

export interface ScenarioResult {
  s: number;
  P0: number;
  L: number;
  cost: number;
}

/**
 * Calcula P0 and L for a finite population queueing model with s servers.
 *
 * Modelo M/M/s con fuente finita (modelo del reparador de maquinas).
 * Usa el enfoque de razones sucesivas para estabilidad numerica.
 */
function calculateModel(
  N: number,
  lambda: number,
  mu: number,
  s: number,
): { P0: number; L: number } {
  const rho = lambda / mu;

  const ratios: number[] = new Array(N + 1).fill(0);
  ratios[0] = 1;

  for (let n = 1; n <= N; n++) {
    if (n <= s) {
      ratios[n] = (ratios[n - 1] * (N - n + 1) * rho) / n;
    } else {
      ratios[n] = (ratios[n - 1] * (N - n + 1) * rho) / s;
    }
  }

  const sum = ratios.reduce((acc, val) => acc + val, 0);
  const P0 = 1 / sum;

  let L = 0;
  for (let n = 0; n <= N; n++) {
    L += n * P0 * ratios[n];
  }

  return { P0, L };
}

/**
 * Costo Total = (s * Cs) + (L * Cw)
 */
function calculateTotalCost(s: number, Cs: number, L: number, Cw: number): number {
  return s * Cs + L * Cw;
}

/**
 * Calcula todos los escenarios para 1 y 2 servidores a partir de los parametros.
 */
export function calculateScenarios(params: QueueParams): ScenarioResult[] {
  const { N, lambda, mu, Cs, Cw } = params;

  const scenarios: ScenarioResult[] = [];

  for (const s of [1, 2]) {
    const { P0, L } = calculateModel(N, lambda, mu, s);
    const cost = calculateTotalCost(s, Cs, L, Cw);
    scenarios.push({ s, P0, L, cost });
  }

  return scenarios;
}
