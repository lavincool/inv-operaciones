export interface MMSvsMM1Input {
  tasaLlegada: number;
  tasaServicio: number;
  numeroServidores: number;
}

export interface MMSvsMM1Desgloses {
  rho: string;
  P0: string;
  Lq: string;
  WqUnico: string;
  lambdaI: string;
  WqSeparado: string;
}

export interface MMSvsMM1Output {
  utilizacion: number;
  probCero: number;
  lqUnico: number;
  wqUnicoHoras: number;
  wqUnicoMinutos: number;
  wqSeparadoHoras: number;
  wqSeparadoMinutos: number;
  conclusion: string;
  desgloses: MMSvsMM1Desgloses;
}

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

export function calculateMMSvsMM1(input: MMSvsMM1Input): MMSvsMM1Output {
  const { tasaLlegada, tasaServicio, numeroServidores } = input;

  if (tasaLlegada <= 0) {
    throw new Error("La tasa de llegada debe ser mayor a cero.");
  }
  if (tasaServicio <= 0) {
    throw new Error("La tasa de servicio debe ser mayor a cero.");
  }
  if (numeroServidores < 1 || !Number.isInteger(numeroServidores)) {
    throw new Error("El numero de servidores debe ser un entero mayor o igual a 1.");
  }

  const lambda = tasaLlegada;
  const mu = tasaServicio;
  const s = numeroServidores;

  const rho = lambda / (s * mu);

  if (rho >= 1) {
    throw new Error(
      `El sistema no es estable. El factor de utilizacion (ρ = ${fmt(rho)}) debe ser menor a 1. ` +
      `Aumente la tasa de servicio, reduzca la tasa de llegada o incremente el numero de servidores.`,
    );
  }

  const lambdaOverMu = lambda / mu;

  // P0: probability of zero customers in M/M/s
  let sum = 0;
  for (let n = 0; n <= s - 1; n++) {
    sum += Math.pow(lambdaOverMu, n) / factorial(n);
  }
  const lastTerm = Math.pow(lambdaOverMu, s) / (factorial(s) * (1 - rho));
  const P0 = 1 / (sum + lastTerm);

  // Lq: average number in queue for M/M/s
  const Lq = (P0 * Math.pow(lambdaOverMu, s) * rho) / (factorial(s) * Math.pow(1 - rho, 2));

  // Wq for single queue (M/M/s)
  const WqUnico = Lq / lambda;
  const WqUnicoMinutos = WqUnico * 60;

  // M/M/1 divided: each server gets lambda/s arrivals
  const lambdaI = lambda / s;

  if (lambdaI >= mu) {
    throw new Error(
      `El sistema M/M/1 dividido no es estable. La tasa de llegada por servidor (${fmt(lambdaI)}) ` +
      `debe ser menor a la tasa de servicio (${fmt(mu)}).`,
    );
  }

  const WqSeparado = lambdaI / (mu * (mu - lambdaI));
  const WqSeparadoMinutos = WqSeparado * 60;

  const conclusion =
    "Cuando existe una sola fila comun, el sistema es mas eficiente porque el siguiente cliente puede ser atendido por cualquiera de los estilistas disponibles. " +
    "En cambio, cuando los clientes exigen un estilista especifico se forman filas separadas y aumenta el tiempo de espera promedio.";

  // Build desgloses LaTeX strings

  const desgloseRho =
    `\\rho = \\frac{\\lambda}{s \\cdot \\mu} = \\frac{${lambda}}{${s} \\cdot ${mu}} = ${fmt(rho)}`;

  // Build P0 desglose
  let sumTerms = "";
  for (let n = 0; n <= s - 1; n++) {
    const term = Math.pow(lambdaOverMu, n) / factorial(n);
    if (n === 0) {
      sumTerms += `${fmt(term)}`;
    } else if (n === 1) {
      sumTerms += ` + \\frac{${fmt(lambdaOverMu)}}{1!}`;
    } else {
      sumTerms += ` + \\frac{(${fmt(lambdaOverMu)})^{${n}}}{${n}!}`;
    }
  }

  const lastTermStr =
    `\\frac{(${fmt(lambdaOverMu)})^{${s}}}{${s}!(1-${fmt(rho)})}`;

  const desgloseP0 =
    `P_0 = \\left[ \\sum_{n=0}^{${s - 1}} \\frac{(\\lambda/\\mu)^n}{n!} + \\frac{(\\lambda/\\mu)^{${s}}}{${s}!(1-\\rho)} \\right]^{-1} \\\\` +
    `P_0 = \\left[ ${sumTerms} + ${lastTermStr} \\right]^{-1} \\\\` +
    `P_0 = \\left[ ${fmt(sum + lastTerm)} \\right]^{-1} = ${fmt(P0)}`;

  const desgloseLq =
    `L_q = \\frac{P_0 (\\lambda/\\mu)^{${s}} \\rho}{${s}! (1-\\rho)^2} = \\frac{${fmt(P0)} \\cdot (${fmt(lambdaOverMu)})^{${s}} \\cdot ${fmt(rho)}}{${s}! \\cdot (${fmt(1 - rho)})^2} = ${fmt(Lq)}`;

  const desgloseWqUnico =
    `W_q^{(M/M/s)} = \\frac{L_q}{\\lambda} = \\frac{${fmt(Lq)}}{${lambda}} = ${fmt(WqUnico)} \\text{ horas} = ${fmt(WqUnicoMinutos)} \\text{ minutos}`;

  const desgloseLambdaI =
    `\\lambda_i = \\frac{\\lambda}{s} = \\frac{${lambda}}{${s}} = ${fmt(lambdaI)}`;

  const desgloseWqSeparado =
    `W_q^{(M/M/1)} = \\frac{\\lambda_i}{\\mu(\\mu - \\lambda_i)} = \\frac{${fmt(lambdaI)}}{${mu}(${mu} - ${fmt(lambdaI)})} = ${fmt(WqSeparado)} \\text{ horas} = ${fmt(WqSeparadoMinutos)} \\text{ minutos}`;

  return {
    utilizacion: rho,
    probCero: P0,
    lqUnico: Lq,
    wqUnicoHoras: WqUnico,
    wqUnicoMinutos: WqUnicoMinutos,
    wqSeparadoHoras: WqSeparado,
    wqSeparadoMinutos: WqSeparadoMinutos,
    conclusion,
    desgloses: {
      rho: desgloseRho,
      P0: desgloseP0,
      Lq: desgloseLq,
      WqUnico: desgloseWqUnico,
      lambdaI: desgloseLambdaI,
      WqSeparado: desgloseWqSeparado,
    },
  };
}
