import Groq from 'groq-sdk';
import { z } from 'zod';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

console.log('Chave GROQ:', groq.apiKey);
console.log('Usando modelo GROQ:', MODEL);

const ItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  type: z.enum(['income', 'expense']).optional(),
});

// Schema do batch
const BatchSchema = z.object({
  items: z.array(ItemSchema),
});

interface In {
  id: string;
  title: string;
  description: string;
  amount: number; // assinado (+ receita, - despesa)
  rawDate: string; // ISO
}

type Out = z.infer<typeof ItemSchema>;

const CATEGORIES = [
  'Alimentação',
  'Mercado',
  'Transporte',
  'Streaming',
  'Saúde',
  'Lazer',
  'Assinaturas',
  'Educação',
  'Moradia',
  'Serviços',
  'Fatura',
  'Entradas',
  'Outros',
];

export function buildSystemPrompt(CATEGORIES: string[]) {
  return [
    'Você é um CLASSIFICADOR FINANCEIRO para extratos bancários (PT-BR).',
    '',
    'TAREFA',
    '— Para cada transação recebida, retorne EXATAMENTE um objeto por item em {"items":[...]} com os campos:',
    '  - id: string                   (id original do item)',
    '  - category: string             (UMA categoria da lista permitida)',
    '  - type: "income" | "expense"   (receita ou despesa)',
    '  - confidence: number           (0 a 1, quanto você está confiante)',
    '',
    'CATEGORIAS PERMITIDAS',
    ...CATEGORIES.map((c) => `- ${c}`),
    '',
    'REGRAS DE CLASSIFICAÇÃO',
    '1) SINAL DO VALOR:',
    '   - amount > 0  → type = "income" (entrada).',
    '   - amount < 0  → type = "expense" (saída).',
    '',
    '2) HEURÍSTICAS FREQUENTES:',
    '   - "pagamento de fatura", "fatura", "cartão": categoria = "Fatura" (geralmente expense).',
    '   - PIX recebida / crédito com PIX / transferência recebida: categoria = "Entradas", type = "income".',
    '   - PIX enviada / transferência enviada: se não houver contexto específico, categoria = "Serviços", type = "expense".',
    '   - Combustível/posto/UBER/99/IPVA/estacionamento: "Transporte".',
    '   - Drogaria/farmácia/consulta/exame/plano: "Saúde".',
    '   - Restaurantes/lanche/pizzaria/boteco: "Alimentação".',
    '   - Supermercado/atacado/mercearia: "Mercado".',
    '   - Streaming (Netflix/Spotify/Prime/Disney/HBO): "Streaming".',
    '   - Assinaturas de software (Notion/Figma/Adobe etc.): "Assinaturas".',
    '   - Despesas da casa (aluguel/condomínio/luz/CPFL/CEMIG/internet/Vivo/Claro/Tim/NET/GVT/IPTU): "Moradia".',
    '   - Cursos/faculdade/mensalidade: "Educação".',
    '   - Ingressos/show/viagem/hotel/bar: "Lazer".',
    '   - Sem match claro: "Outros".',
    '',
    '3) LIMPEZA DE TEXTO (MENTAL, NÃO ALTERE O INPUT):',
    '   - Ignore frases decorativas do banco: "compra no débito/crédito", "pelo PIX", "pagamento", "transferência".',
    '   - Ignore CNPJ/CPF, contas, números longos e UUIDs — foque no nome do estabelecimento e palavras-chave.',
    '',
    '4) TÍTULOS E MARCAS CONHECIDAS: (use como pistas, não invente)',
    '   - "Raiadrogasil", "Drogasil", "Raia" → Saúde',
    '   - "Posto", "Postosoutobahia" → Transporte',
    '   - "Super Damasco", "Armazém Florestal" → Mercado',
    '   - "Pizzaria Casa Nossa", "Calebito" → Alimentação',
    '   - "Kings Beers" → Lazer',
    '   - "Bco"/"Banco" isolado → Serviços (salvo se houver indicação clara de crédito/entrada)',
    '   - Se algo sugerir salário/provento/bônus → Entradas',
    '',
    '5) CONFIANÇA',
    '   - 1.0: nome explícito e regra direta (ex.: "Netflix", "Pagamento de fatura").',
    '   - 0.7: match por categoria com forte indício (ex.: "Posto X", "Drogasil").',
    '   - 0.4: indício fraco/ambíguo.',
    '   - 0.2: muito incerto (quase sem pista).',
    '',
    '6) RESTRIÇÕES DE SAÍDA',
    '   - Responda ESTRITAMENTE em JSON válido no formato: {"items":[{...}]}',
    '   - NÃO inclua comentários, explicações, texto fora do JSON ou campos extras.',
    '',
    'VALIDAÇÃO',
    '— Se a categoria não estiver na lista permitida, use "Outros".',
    '— Sempre retornar uma category e um type por item.',
    '',
    'EXEMPLOS (apenas referência de estilo; não replique no output):',
    'Entrada PIX:',
    '{"items":[{"id":"1","category":"Entradas","type":"income","confidence":0.9}]}',
    'Pagamento de fatura:',
    '{"items":[{"id":"2","category":"Fatura","type":"expense","confidence":1}]}',
    'Compra em supermercado:',
    '{"items":[{"id":"3","category":"Mercado","type":"expense","confidence":0.9}]}',
    'Almoço/pizzaria:',
    '{"items":[{"id":"4","category":"Alimentação","type":"expense","confidence":0.8}]}',
    '',
    'Lembre-se: UMA categoria por transação; em dúvida, "Outros".',
  ].join('\n');
}

export async function aiCategorizeBatch(input: In[]): Promise<Out[]> {
  if (!input.length) return [];

  // Prompt enxuto + instruções claras para JSON
  const system = buildSystemPrompt(CATEGORIES);
  
  const user = [
    'Dados (JSON):',
    JSON.stringify(
      input.map((x) => ({
        id: x.id,
        title: x.title,
        description: x.description,
        amount: x.amount,
        date: x.rawDate,
      })),
      null,
      2
    ),
    '',
    'Retorne no formato:',
    '{"items":[{"id":"<id>","category":"<categoria>","confidence":0.0-1.0,"type":"income|expense"}]}',
  ].join('\n');

  console.log('Prompt IA:', system, '\n', user);

  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],

    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '{}';

  // Parse e valida
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    // Heurística de recuperação
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) json = JSON.parse(raw.slice(start, end + 1));
    else throw new Error('Falha ao parsear saída da IA');
  }

  const parsed = BatchSchema.safeParse(json);
  if (!parsed.success) {
    // Fallback: classifica todo mundo como "Outros"
    return input.map((x) => ({
      id: x.id,
      category: 'Outros',
      confidence: 0.2,
      type: x.amount >= 0 ? 'income' : 'expense',
    }));
  }

  // Normaliza: garante categorias válidas e preenche type/confidence quando faltar
  const items = parsed.data.items.map<Out>((it) => {
    const cat = CATEGORIES.includes(it.category) ? it.category : 'Outros';
    const base = input.find((i) => i.id === it.id);
    const type = it.type ?? ((base?.amount ?? 0) >= 0 ? 'income' : 'expense');
    let conf = typeof it.confidence === 'number' ? it.confidence : undefined;
    if (conf !== undefined) conf = Math.max(0, Math.min(1, conf));
    return { id: it.id, category: cat, confidence: conf, type };
  });

  // Garante 1:1 com a entrada
  const map = new Map(items.map((x) => [x.id, x]));
  for (const i of input) {
    if (!map.has(i.id)) {
      map.set(i.id, {
        id: i.id,
        category: 'Outros',
        confidence: 0.2,
        type: i.amount >= 0 ? 'income' : 'expense',
      });
    }
  }
  return Array.from(map.values());
}
