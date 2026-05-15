// src/actions/orcamentos.ts
'use server';

import { db } from '@/db';
import { orcamentos, orcamentoItens, produtos } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getOrcamentos() {
  try {
    // Calculamos o total de cada orçamento somando seus itens
    const data = await db.select({
      id: orcamentos.id,
      cliente: orcamentos.cliente,
      data: orcamentos.data,
      status: orcamentos.status,
      total: sql<number>`COALESCE(SUM(${orcamentoItens.preco_venda} * ${orcamentoItens.quantidade}), 0)`
    })
    .from(orcamentos)
    .leftJoin(orcamentoItens, eq(orcamentos.id, orcamentoItens.orcamentoId))
    .groupBy(orcamentos.id)
    .orderBy(sql`${orcamentos.data} DESC`);

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return { success: false, error: 'Falha ao buscar dados' };
  }
}

export async function createOrcamento(cliente: string) {
  try {
    const [newOrc] = await db.insert(orcamentos).values({
      cliente: cliente.toUpperCase(),
      status: 'PENDENTE',
      mk_padrao: 3.0
    }).returning();
    
    revalidatePath('/');
    return { success: true, id: newOrc.id };
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return { success: false, error: 'Falha ao criar registro' };
  }
}

export async function getOrcamentoDetalhes(id: number) {
  try {
    const [orc] = await db.select().from(orcamentos).where(eq(orcamentos.id, id));
    if (!orc) return { success: false, error: 'Orçamento não encontrado' };

    const itens = await db.select({
      id: orcamentoItens.id,
      quantidade: orcamentoItens.quantidade,
      markup: orcamentoItens.markup,
      preco_venda: orcamentoItens.preco_venda,
      produto: {
        id: produtos.id,
        sku: produtos.sku,
        descricao: produtos.descricao,
        preco_custo: produtos.preco_custo
      }
    })
    .from(orcamentoItens)
    .innerJoin(produtos, eq(orcamentoItens.produtoId, produtos.id))
    .where(eq(orcamentoItens.orcamentoId, id));

    return { success: true, data: { ...orc, itens } };
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    return { success: false, error: 'Erro ao carregar detalhes' };
  }
}

export async function addOrcamentoItem(orcamentoId: number, produtoId: number, quantidade: number, markup: number) {
  try {
    // Buscar preço de custo do produto
    const [prod] = await db.select().from(produtos).where(eq(produtos.id, produtoId));
    if (!prod) throw new Error('Produto não encontrado');

    const preco_venda = prod.preco_custo * markup;

    await db.insert(orcamentoItens).values({
      orcamentoId,
      produtoId,
      quantidade,
      markup,
      preco_venda
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    return { success: false, error: 'Falha ao adicionar item' };
  }
}

export async function deleteOrcamento(id: number) {
  try {
    // Primeiro removemos os itens (Drizzle faria se tivesse CASCADE, mas vamos garantir)
    await db.delete(orcamentoItens).where(eq(orcamentoItens.orcamentoId, id));
    await db.delete(orcamentos).where(eq(orcamentos.id, id));
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    return { success: false, error: 'Falha ao excluir' };
  }
}
