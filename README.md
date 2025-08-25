# 📊 Finance Dashboard

Um sistema de **gestão financeira pessoal** feito com **Next.js + MongoDB**, que permite:

- Importar arquivos CSV de extratos bancários (ex.: Nubank);
- Categorização automática das transações (Alimentação, Mercado, Transporte, etc);
- Uso de **IA (Groq)** como fallback para classificar transações;
- Visualização em **dashboard interativo** com:
  - Cartões de saldo, entradas, saídas e maior gasto;
  - Gráficos de receitas/despesas por mês;
  - Principais gastos destacados;
  - Listagem detalhada de transações com paginação.

## 🚀 Como rodar

1. Instale as dependências:

```bash
pnpm install
```

2. Configure o banco (MongoDB em Docker, por exemplo):

```bash
   docker run -d -p 27017:27017 --name mongo mongo:6
```

3. Crie um arquivo .env com:

```bash
  MONGODB_URI=mongodb://localhost:27017/finance
  GROQ_API_KEY=...
```

4. Rode o projeto:

```bash
  pnpm dev
```

## 📌 Tech Stack

- Next.js (App Router)
- MongoDB + Mongoose
- Groq (IA para categorização)
- Tailwind + shadcn/ui
