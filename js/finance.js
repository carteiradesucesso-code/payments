// Módulo financeiro mínimo (sem dependências externas)
// - Base: centavos (inteiros) para evitar erros de ponto flutuante.
// - Funções puras para parsing, formatação e cálculos comuns.

/** Converte string/number para centavos (int). Aceita vírgula e ponto. */
export function parseToCents(input) {
  if (input === null || input === undefined) return 0
  if (typeof input === 'number') {
    const cents = Math.round(input * 100)
    return Number.isFinite(cents) ? cents : 0
  }
  // string: normaliza separadores
  const s = String(input).trim()
  if (!s) return 0
  // Remove milhares e troca vírgula por ponto
  const normalized = s.replace(/\./g, '').replace(/,/g, '.')
  const n = Number(normalized)
  const cents = Math.round((Number.isFinite(n) ? n : 0) * 100)
  return Number.isFinite(cents) ? cents : 0
}

/** Formata centavos em BRL usando Intl */
export function formatBRL(cents) {
  const value = (Number(cents) || 0) / 100
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/** Soma de centavos (inteiros). */
export function somarCents(a, b) { return (Number(a) || 0) + (Number(b) || 0) }

/** Subtração de centavos (inteiros). */
export function subtrairCents(a, b) { return (Number(a) || 0) - (Number(b) || 0) }

/**
 * Calcula parcela mensal fixa (PMT) para empréstimo no sistema PRICE.
 * @param {number} principalCents - valor principal em centavos
 * @param {number} taxaAnualPct - taxa anual em % (ex: 12 para 12%)
 * @param {number} meses - número de parcelas
 * @returns {{ parcelaCents: number }}
 */
export function calcularPMT(principalCents, taxaAnualPct, meses) {
  const P = (Number(principalCents) || 0) / 100
  const n = Math.max(1, Math.floor(Number(meses) || 0))
  const iMensal = (Number(taxaAnualPct) || 0) / 100 / 12
  if (!Number.isFinite(P) || P <= 0 || !Number.isFinite(iMensal) || iMensal < 0) {
    return { parcelaCents: 0 }
  }
  // PMT = P * i / (1 - (1 + i)^-n)
  const denom = 1 - Math.pow(1 + iMensal, -n)
  const pmt = denom === 0 ? 0 : (P * iMensal) / denom
  const parcelaCents = Math.round(pmt * 100)
  return { parcelaCents: parcelaCents > 0 ? parcelaCents : 0 }
}

/**
 * Simulação de juros compostos mensais.
 * @param {number} principalCents - valor inicial em centavos
 * @param {number} taxaAnualPct - taxa anual em %
 * @param {number} meses - períodos mensais
 * @returns {{ valorFinalCents: number, rendimentoCents: number }}
 */
export function calcularJurosCompostos(principalCents, taxaAnualPct, meses) {
  const P = (Number(principalCents) || 0) / 100
  const n = Math.max(1, Math.floor(Number(meses) || 0))
  const iMensal = (Number(taxaAnualPct) || 0) / 100 / 12
  if (!Number.isFinite(P) || P <= 0 || !Number.isFinite(iMensal) || iMensal < 0) {
    return { valorFinalCents: 0, rendimentoCents: 0 }
  }
  const VF = P * Math.pow(1 + iMensal, n)
  const valorFinalCents = Math.round(VF * 100)
  const rendimentoCents = Math.max(0, valorFinalCents - Math.round(P * 100))
  return { valorFinalCents, rendimentoCents }
}

