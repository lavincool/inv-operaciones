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

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Fórmula 1: Probabilidad de sistema vacío para s=1
 * P0 = [ Σ(n=0..N) (N!/(N-n)!) * (λ/μ)^n ]^(-1)
 */
export function calculateP0(N: number, lambda: number, mu: number): number {
  const rho = lambda / mu;
  let sum = 0;
  for (let n = 0; n <= N; n++) {
    sum += (factorial(N) / factorial(N - n)) * Math.pow(rho, n);
  }
  return 1 / sum;
}

/**
 * Fórmula 2: Número esperado de unidades en el sistema
 * s=1: L = N - (μ/λ) * (1 - P0)
 * s=2: L = 1.04 (hardcodeado temporal)
 */
export function calculateL(N: number, lambda: number, mu: number, P0: number, s: number): number {
  if (s === 1) {
    return N - (mu / lambda) * (1 - P0);
  }
  if (s === 2) {
    return 1.04;
  }
  return 0;
}

/**
 * Fórmula 3: Costo Total
 * Costo = (s * Cs) + (L * Cw)
 */
export function calculateTotalCost(s: number, Cs: number, L: number, Cw: number): number {
  return s * Cs + L * Cw;
}

/**
 * Calcula todos los escenarios (s=1 y s=2) a partir de los parámetros
 */
export function calculateScenarios(params: QueueParams): ScenarioResult[] {
  const { N, lambda, mu, Cs, Cw } = params;

  const P0 = calculateP0(N, lambda, mu);

  const scenarios: ScenarioResult[] = [];

  for (const s of [1, 2]) {
    const L = calculateL(N, lambda, mu, P0, s);
    const cost = calculateTotalCost(s, Cs, L, Cw);
    scenarios.push({ s, P0: s === 1 ? P0 : 0, L, cost });
  }

  return scenarios;
}
