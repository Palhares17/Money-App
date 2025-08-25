/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import csv from 'csvtojson';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import { localCategorize } from '@/utils/categorizer';
import { aiCategorizeBatch } from '@/utils/aiCategorizer';
import { Transaction } from '@/models/transaction';
import { normalizeTitleAndDescription } from '@/utils/normalizeTransactions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parsePtBrDate(d: string) {
  const [dd, mm, yyyy] = d.split('/');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}
function makeIdStable(dateISO: string, title: string, amount: number) {
  const base = `${dateISO}|${title}|${amount}`;
  return crypto.createHash('sha1').update(base).digest('hex').slice(0, 24);
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Campo "file" ausente' }, { status: 400 });
    }

    const csvText = Buffer.from(await file.arrayBuffer()).toString('utf8');
    const rows = await csv({ trim: true }).fromString(csvText);
    if (!rows.length) {
      return NextResponse.json({ error: 'CSV vazio' }, { status: 400 });
    }

    type Draft = {
      _id: string;
      title: string;
      description?: string;
      amount: number; // aqui: módulo; type controla sentido
      date: Date;
      type: 'income' | 'expense';
      category?: string;
      aiConfidence?: number;
    };

    const drafts: Draft[] = rows.map((r: any) => {
      const date = parsePtBrDate(String(r['Data']));

      // parse robusto de valores BR: "1.234,56" -> 1234.56
      const rawAmount = Number(String(r['Valor']).replace(',', '.'));

      const type = rawAmount >= 0 ? 'income' : 'expense';

      const rawTitle = String(r['Descrição'] || r['Identificador'] || 'Transação').trim();
      const rawDesc = r['Descrição'] ? String(r['Descrição']) : undefined

      const normalized = normalizeTitleAndDescription(rawTitle, rawDesc);
      const dateISO = date.toISOString();
      const _id = r['Identificador']?.trim()
        ? String(r['Identificador']).trim()
        : makeIdStable(dateISO, normalized.title, rawAmount);

      return {
        _id,
        title: normalized.title, // curto, ex.: "Calebito"
        description: normalized.description, // curto, ex.: "compra no débito calebito"
        amount: rawAmount,
        date,
        type,
      };
    });

    // 1) regras locais
    for (const d of drafts) {
      const cat = localCategorize(`${d.title} ${d.description ?? ''}`);
      if (cat) {
        d.category = cat;
        d.aiConfidence = 1; // 1.0 para regras
      }
    }

    // 2) fallback IA
    const missing = drafts.filter((d) => !d.category);
    let aiUsedFor = 0;
    if (missing.length) {
      aiUsedFor = missing.length;

      const chunkSize = 100;
      for (let i = 0; i < missing.length; i += chunkSize) {
        const chunk = missing.slice(i, i + chunkSize);
        const aiInput = chunk.map((d) => ({
          id: d._id,
          title: d.title,
          description: d.description ?? '',
          amount: d.type === 'income' ? d.amount : -d.amount, // envia assinado para IA
          rawDate: d.date.toISOString(),
        }));
        const aiOut = await aiCategorizeBatch(aiInput);
        const map = new Map(aiOut.map((x) => [x.id, x]));

        for (const d of chunk) {
          const o = map.get(d._id);
          if (!o) continue;
          d.category = o.category || 'Outros';
          d.aiConfidence =
            typeof o.confidence === 'number' ? Math.max(0, Math.min(1, o.confidence)) : undefined;

          // Se quiser aceitar correção de type da IA:
          if (o.type === 'income' || o.type === 'expense') d.type = o.type;
        }
      }
    }

    // 3) default para quem ainda ficou sem categoria
    for (const d of drafts) if (!d.category) d.category = 'Outros';

    // 4) upsert em lote
    const ops = drafts.map((d) => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $set: d },
        upsert: true,
      },
    }));
    const result = ops.length ? await Transaction.bulkWrite(ops, { ordered: false }) : null;

    return NextResponse.json({
      imported: result?.upsertedCount ?? 0,
      updated: result?.modifiedCount ?? 0,
      totalRows: rows.length,
      aiUsedFor,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const transactions = await Transaction.find().sort({ date: -1 }).limit(10).lean();

    return NextResponse.json({
      ok: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro interno' }, { status: 500 });
  }
}
