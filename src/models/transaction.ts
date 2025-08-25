/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, models } from 'mongoose';

const TransactionSchema =
  // reaproveita o schema já existente (se o módulo for recarregado em dev)
  (models.Transaction as any)?.schema ||
  new Schema(
    {
      _id: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      amount: { type: Number, required: true }, // pode ser módulo; type determina sentido
      date: { type: Date, required: true, default: Date.now },
      category: { type: String, required: true },
      description: { type: String },
      type: { type: String, enum: ['income', 'expense'], required: true },
      aiConfidence: { type: Number }, // opcional
    },
    { timestamps: true }
  );

// se já existir, usa; se não, registra
export const Transaction = models.Transaction || model('Transaction', TransactionSchema);
