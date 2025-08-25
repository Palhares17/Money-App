export type LocalCategory =
  | 'Alimentação'
  | 'Mercado'
  | 'Transporte'
  | 'Streaming'
  | 'Saúde'
  | 'Lazer'
  | 'Assinaturas'
  | 'Educação'
  | 'Moradia'
  | 'Serviços'
  | 'Fatura'
  | 'Entradas'
  | 'Outros';

// --- helpers ---
function stripDiacritics(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
}
function normalizeText(raw: string) {
  let s = stripDiacritics(raw.toLowerCase());

  // Ruídos comuns do banco
  s = s
    .replace(/\bcompra no debito\b/g, '')
    .replace(/\bcompra no credito\b/g, '')
    .replace(/\bpagamento\b/g, '')
    .replace(/\btransferencia\b/g, '')
    .replace(/\bpelo pix\b/g, '')
    .replace(/\bpix\b/g, ' pix ') // mantem "pix" isolado pra regras
    .replace(/\brecebida(o)?\b/g, ' recebida ')
    .replace(/\benviada(o)?\b/g, ' enviada ')
    .replace(/\bconta\b/g, '')
    .replace(/\bfatura\b/g, ' fatura ')
    // remove CNPJs/CPFs, UUIDs, contas, sufixos numéricos
    .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, '')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/g, '')
    .replace(/\b\d{3,}[-/]\d+\b/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

// regras por categoria (keywords + merchants do seu extrato)
const rules: Array<{ cat: LocalCategory; patterns: RegExp[] }> = [
  // PIX
  {
    cat: 'Entradas',
    patterns: [/\bpix\s*recebid/i, /\brecebid[ao]\s*pelo?\s*pix/i, /\bcredit[oa]\b.*\bpix/i],
  },
  {
    cat: 'Serviços',
    patterns: [
      /\bpix\s*enviad/i,
      /\benviad[ao]\s*pelo?\s*pix/i,
      /\bdebito\b.*\bpix/i,
      /\btransferencia\s*enviad/i,
    ],
  },

  // Fatura/Cartão
  {
    cat: 'Fatura',
    patterns: [/\bpagamento\s*de\s*fatura/i, /\bfatura\b/i, /\bcart[aã]o\b/i],
  },

  // Mercado (supermercados/mercearias)
  {
    cat: 'Mercado',
    patterns: [
      /supermercad/i,
      /\bmercado\b/i,
      /atacad/i,
      /\bcarrefour\b/i,
      /\bassai\b/i,
      /\bextra\b/i,
      /\bsuper\s*damasco\b/i,
      /armazem\b/i,
      /\bcasa\s*de\s*carne\b/i,
    ],
  },

  // Alimentação (refeições, lanches)
  {
    cat: 'Alimentação',
    patterns: [
      /restauran/i,
      /lanch/i,
      /pizza/i,
      /\bpizzaria\b/i,
      /\bbk\b|\bburger\s*king\b/i,
      /\bmc(donald)?s?\b/i,
      /\bcalebito\b/i,
      /\bboteco\b/i,
      /\blanche\b/i,
    ],
  },

  // Saúde
  {
    cat: 'Saúde',
    patterns: [
      /farmac/i,
      /drogari/i,
      /drogas?il/i,
      /raiadrogasil/i,
      /clinica/i,
      /\bconsulta\b/i,
      /\bexame\b/i,
      /\bplano\s*de\s*saude\b/i,
    ],
  },

  // Transporte/Combustível
  {
    cat: 'Transporte',
    patterns: [
      /\buber\b/i,
      /\b99\b/i,
      /gasolin/i,
      /diesel/i,
      /etanol/i,
      /combust/i,
      /\bposto\b/i,
      /postosoutobahia/i,
      /ipva\b/i,
      /estaciona/i,
    ],
  },

  // Streaming
  {
    cat: 'Streaming',
    patterns: [/netflix/i, /spotify/i, /prime\s*video/i, /disney/i, /hbo|max\b/i, /apple\s*tv/i],
  },

  // Lazer
  {
    cat: 'Lazer',
    patterns: [/cinema/i, /ingress/i, /show/i, /viagem/i, /hotel/i, /kings\s*beers/i, /\bbar\b/i],
  },

  // Educação
  {
    cat: 'Educação',
    patterns: [/curso\b/i, /udemy/i, /alura/i, /faculdade/i, /mensalidade\b/i, /escola\b/i],
  },

  // Moradia (fixos da casa)
  {
    cat: 'Moradia',
    patterns: [
      /aluguel/i,
      /condom[ií]nio/i,
      /energia\b/i,
      /\bcpfl\b/i,
      /\bcemig\b/i,
      /internet\b/i,
      /\b(vivo|claro|tim|oi|net|gvt)\b/i,
      /im[oó]veis?/i,
      /iptu\b/i,
    ],
  },

  // Assinaturas (softwares/serviços recorrentes)
  {
    cat: 'Assinaturas',
    patterns: [/assinat(ura)?/i, /licen[cs]a/i, /notion/i, /figma/i, /adobe/i],
  },

  // Serviços (genérico / boletos / taxas / bancos)
  {
    cat: 'Serviços',
    patterns: [
      /manuten/i,
      /servi[cç]o/i,
      /limpeza/i,
      /frete/i,
      /taxa\b/i,
      /\bboleto\b/i,
      /\bbanco\b|\bbco\b/i,
    ],
  },

  // Entradas (fallback por palavras)
  {
    cat: 'Entradas',
    patterns: [/sal[aá]rio\b/i, /provent/i, /dep[óo]sito/i, /\bcredito\b/i],
  },
];

// merchants específicos que vi no seu extrato e não se encaixam 100% por palavras genéricas
const vendors: Array<{ rx: RegExp; cat: LocalCategory }> = [
  { rx: /raiadrogasilsa|drogasil|raia/i, cat: 'Saúde' },
  { rx: /postos?outobahia/i, cat: 'Transporte' },
  { rx: /super\s*damasco/i, cat: 'Mercado' },
  { rx: /armazem\s*florestal/i, cat: 'Mercado' },
  { rx: /pizzaria\s*casa\s*nossa/i, cat: 'Alimentação' },
  { rx: /casa\s*de\s*carne/i, cat: 'Mercado' },
  { rx: /kings\s*beers/i, cat: 'Lazer' },
  // dúvidas abaixo – me diga o que são para eu fixar melhor:
  { rx: /\bcrediesmeraldas\b/i, cat: 'Serviços' }, // empréstimo? (posso ajustar)
  { rx: /\bme(p|ep)\b.*gestali|mepayfinancial/i, cat: 'Serviços' }, // gateway/maquininha?
];

export function localCategorize(text: string): LocalCategory | null {
  const s = normalizeText(text);

  // 1) merchants específicos (alta precisão)
  for (const v of vendors) {
    if (v.rx.test(s)) return v.cat;
  }

  // 2) regras por categoria
  for (const r of rules) {
    if (r.patterns.some((rx) => rx.test(s))) return r.cat;
  }

  // 3) nenhum match
  return null;
}
