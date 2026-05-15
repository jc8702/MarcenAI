// src/scripts/reset-db.ts
import { db } from '../db';
import { orcamentos, orcamentoItens, produtos } from '../db/schema';

async function reset() {
  console.log('🗑️ Iniciando limpeza do banco de dados...');
  
  try {
    // A ordem importa devido às chaves estrangeiras
    console.log('- Limpando itens de orçamentos...');
    await db.delete(orcamentoItens);
    
    console.log('- Limpando orçamentos...');
    await db.delete(orcamentos);
    
    console.log('- Limpando produtos (estoque)...');
    await db.delete(produtos);
    
    console.log('✅ Banco de dados limpo com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
    process.exit(1);
  }
}

reset();
