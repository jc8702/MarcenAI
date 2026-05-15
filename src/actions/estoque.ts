// src/actions/estoque.ts
'use server';

import { db } from '@/db';
import { produtos, historicoProdutos } from '@/db/schema';
import { eq, ilike, or, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export async function getEstoque(query?: string, familia?: string) {
  try {
    const data = await db.select().from(produtos).orderBy(produtos.descricao);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    return { success: false, error: 'Falha ao buscar dados do banco' };
  }
}

export async function upsertProduto(data: any) {
  try {
    const sanitizedData = {
      ...data,
      sku: String(data.sku || '').toUpperCase(),
      descricao: String(data.descricao || '').toUpperCase(),
      familia: String(data.familia || '').toUpperCase(),
      unidade: String(data.unidade || '').toUpperCase(),
      marca: String(data.marca || '').toUpperCase(),
      fornecedor: String(data.fornecedor || '').toUpperCase(),
      codigoFornecedor: String(data.codigoFornecedor || '').toUpperCase(),
    };

    if (data.id) {
      // Buscar o produto atual para comparar e salvar histórico
      const current = await db.select().from(produtos).where(eq(produtos.id, data.id)).limit(1);
      
      if (current.length > 0) {
        const p = current[0];
        // Se mudou marca, fornecedor ou preço, salva histórico
        if (p.marca !== sanitizedData.marca || p.fornecedor !== sanitizedData.fornecedor || p.preco_custo !== sanitizedData.preco_custo) {
          await db.insert(historicoProdutos).values({
            produtoId: p.id,
            marca: p.marca,
            fornecedor: p.fornecedor,
            preco_custo: p.preco_custo,
          });
        }
      }

      await db.update(produtos)
        .set({ ...sanitizedData, updatedAt: new Date() })
        .where(eq(produtos.id, data.id));
    } else {
      await db.insert(produtos).values(sanitizedData);
    }
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    return { success: false, error: 'Falha ao persistir dados' };
  }
}

export async function deleteProdutosEmMassa(ids: number[]) {
  try {
    await db.delete(produtos).where(inArray(produtos.id, ids));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir em massa:', error);
    return { success: false, error: 'Falha ao remover itens selecionados' };
  }
}

export async function deleteProduto(id: number) {
  try {
    await db.delete(produtos).where(eq(produtos.id, id));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return { success: false, error: 'Falha ao remover item' };
  }
}

export async function importEstoqueEmMassa(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('Arquivo não encontrado');

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];

    const parseMoeda = (valor: any): number => {
      if (!valor) return 0;
      
      // Se já for número, mas queremos garantir que não foi importado errado (ex: 22176 em vez de 221.76)
      // Porém, vindo do raw: false, será string.
      
      let s = String(valor).trim();
      
      // Remove R$, espaços e caracteres não numéricos exceto vírgula e ponto e sinal de menos
      let limpo = s.replace(/[^\d,.-]/g, '');
      
      if (limpo.includes(',') && limpo.includes('.')) {
        // Formato: 1.234,56 -> O ponto é milhar, a vírgula é decimal
        limpo = limpo.replace(/\./g, '').replace(',', '.');
      } else if (limpo.includes(',')) {
        // Formato: 221,76 ou 1,77 -> A vírgula é decimal
        limpo = limpo.replace(',', '.');
      }
      // Se tiver apenas ponto, como em 160.00 ou 160, tratamos como padrão US/JS
      
      const num = parseFloat(limpo);
      return isNaN(num) ? 0 : num;
    };

    const batch = data.map(row => ({
      sku: String(row.SKU || row.sku || '').toUpperCase(),
      descricao: String(row.Descricao || row.descricao || '').toUpperCase(),
      familia: String(row.Familia || row.familia || 'OUTROS').toUpperCase(),
      unidade: String(row.Unidade || row.unidade || 'UN').toUpperCase(),
      marca: String(row.Marca || row.marca || '').toUpperCase(),
      fornecedor: String(row.Fornecedor || row.fornecedor || '').toUpperCase(),
      codigoFornecedor: String(row.CodigoFornecedor || row.codigo_fornecedor || row.Codigo_Fornecedor || '').toUpperCase(),
      preco_custo: parseMoeda(row.Preco_Custo || row.preco_custo || 0)
    })).filter(item => item.sku && item.descricao);

    if (batch.length > 0) {
      for (const item of batch) {
        // Para importação, também verificamos histórico se já existir
        const current = await db.select().from(produtos).where(eq(produtos.sku, item.sku)).limit(1);
        
        if (current.length > 0) {
          const p = current[0];
          if (p.marca !== item.marca || p.fornecedor !== item.fornecedor || p.preco_custo !== item.preco_custo) {
            await db.insert(historicoProdutos).values({
              produtoId: p.id,
              marca: p.marca,
              fornecedor: p.fornecedor,
              preco_custo: p.preco_custo,
            });
          }
        }

        await db.insert(produtos)
          .values(item)
          .onConflictDoUpdate({
            target: produtos.sku,
            set: {
              descricao: item.descricao,
              familia: item.familia,
              unidade: item.unidade,
              marca: item.marca,
              fornecedor: item.fornecedor,
              codigoFornecedor: item.codigoFornecedor,
              preco_custo: item.preco_custo,
              updatedAt: new Date()
            }
          });
      }
    }
    
    revalidatePath('/');
    return { success: true, count: batch.length };
  } catch (error) {
    console.error('Erro na importação em massa:', error);
    return { success: false, error: 'Erro ao processar planilha' };
  }
}
