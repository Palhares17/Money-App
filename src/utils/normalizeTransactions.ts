// utils/normalizeTransaction.ts
const METHOD_RULES = [
  { re: /\b(d[eé]bito)\b/i, label: 'débito' },
  { re: /\b(cr[eé]dito)\b/i, label: 'crédito' },
  { re: /\b(pix)\b/i, label: 'pix' },
  { re: /\b(transfer[eê]ncia|ted|doc)\b/i, label: 'transferência' },
  { re: /\b(boleto)\b/i, label: 'boleto' },
  { re: /\b(d[eé]bito\s+autom[aá]tico)\b/i, label: 'débito automático' },
  { re: /\b(assinatura|subscription)\b/i, label: 'assinatura' },
];

function titleCase(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos p/ padronizar
    .replace(/\b([a-z])/g, (m) => m.toUpperCase()); // capitaliza
}

function extractMethod(text: string): string | undefined {
  for (const r of METHOD_RULES) if (r.re.test(text)) return r.label;
  return undefined;
}

function cleanMerchant(raw: string): string {
  // pega o trecho após um '-' se existir; caso contrário usa o texto todo
  let t = raw.split(' - ').pop() || raw;

  // remove possíveis sufixos muito genéricos (cidades em caixa alta, UF etc.)
  t = t.replace(/\b([A-Z]{2})\b/g, ''); // UF (RJ, SP...)
  t = t.replace(/\b(RIO|DAS|DOS|DO|DE|DA|OSTRAS?)\b/gi, ''); // palavras comuns em endereço
  t = t.replace(/\s{2,}/g, ' ').trim();

  // se ainda estiver muito longo, pega só a primeira palavra "marca"
  const firstWord = t.split(/\s+/)[0] ?? t;
  const name = firstWord.length >= 3 ? firstWord : (t.split(/\s+/)[1] ?? firstWord);

  return titleCase(name);
}

/**
 * Normaliza título e descrição.
 * Ex.: "Compra no débito - CALEBITO RIO DAS OSTRA"
 *   -> { title: "Calebito", description: "compra no débito calebito" }
 */
export function normalizeTitleAndDescription(rawTitle: string, rawDescription?: string) {
  const base = (rawDescription?.trim() || rawTitle || '').trim();
  const method = extractMethod(base) || extractMethod(rawTitle) || undefined;

  const merchant = cleanMerchant(base || rawTitle);

  const title = merchant; // curto
  const descParts: string[] = [];

  if (method) {
    // "compra no débito/crédito/pix..." ou "recebimento via pix" se for income
    descParts.push(`compra no ${method}`);
  } else {
    descParts.push('compra');
  }

  descParts.push(merchant.toLowerCase());

  const description = descParts
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { title, description };
}
