import { pgTable, serial, text, doublePrecision, timestamp, integer } from 'drizzle-orm/pg-core';

export const familias = pgTable('familias', {
  id: serial('id').primaryKey(),
  nome: text('nome').unique().notNull(),
  prefixo: text('prefixo').notNull(), // EX: 'MDF', 'CONV'
  proximoNumero: integer('proximo_numero').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const produtos = pgTable('produtos', {
  id: serial('id').primaryKey(),
  sku: text('sku').unique().notNull(),
  descricao: text('descricao').notNull(),
  familia: text('familia').notNull(),
  unidade: text('unidade').notNull(),
  marca: text('marca'),
  fornecedor: text('fornecedor'),
  codigoFornecedor: text('codigo_fornecedor'),
  preco_custo: doublePrecision('preco_custo').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const historicoProdutos = pgTable('historico_produtos', {
  id: serial('id').primaryKey(),
  produtoId: integer('produto_id').references(() => produtos.id, { onDelete: 'cascade' }),
  marca: text('marca'),
  fornecedor: text('fornecedor'),
  preco_custo: doublePrecision('preco_custo'),
  alteradoEm: timestamp('alterado_em').defaultNow(),
});

export const orcamentos = pgTable('orcamentos', {
  id: serial('id').primaryKey(),
  cliente: text('cliente').notNull(),
  data: timestamp('data').defaultNow(),
  mk_padrao: doublePrecision('mk_padrao').default(3.0),
  status: text('status').default('PENDENTE'), // PENDENTE, APROVADO, REJEITADO
  createdAt: timestamp('created_at').defaultNow(),
});

export const orcamentoItens = pgTable('orcamento_itens', {
  id: serial('id').primaryKey(),
  orcamentoId: integer('orcamento_id').references(() => orcamentos.id),
  produtoId: integer('produto_id').references(() => produtos.id),
  quantidade: doublePrecision('quantidade').notNull(),
  markup: doublePrecision('markup').notNull(),
  preco_venda: doublePrecision('preco_venda').notNull(),
});
