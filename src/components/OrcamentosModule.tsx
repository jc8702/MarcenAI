// src/components/OrcamentosModule.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getOrcamentos, createOrcamento, getOrcamentoDetalhes, addOrcamentoItem, deleteOrcamento } from '@/actions/orcamentos';
import { getEstoque } from '@/actions/estoque';

export default function OrcamentosModule() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [orcamentoDetalhe, setOrcamentoDetalhe] = useState<any>(null);
  
  // Modals
  const [isNewOrcModalOpen, setIsNewOrcModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newCliente, setNewCliente] = useState('');
  
  // Inventory for Selection
  const [estoque, setEstoque] = useState<any[]>([]);

  const loadOrcamentos = async () => {
    setLoading(true);
    const res = await getOrcamentos();
    if (res.success) setOrcamentos(res.data || []);
    setLoading(false);
  };

  const loadDetalhes = async (id: number) => {
    setLoading(true);
    const res = await getOrcamentoDetalhes(id);
    if (res.success) {
      setOrcamentoDetalhe(res.data);
      setSelectedId(id);
    }
    setLoading(false);
  };

  const loadEstoque = async () => {
    const res = await getEstoque();
    if (res.success) setEstoque(res.data || []);
  };

  useEffect(() => {
    if (selectedId) {
      loadDetalhes(selectedId);
    } else {
      loadOrcamentos();
    }
  }, [selectedId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createOrcamento(newCliente);
    if (res.success && res.id) {
      setIsNewOrcModalOpen(false);
      setNewCliente('');
      loadDetalhes(res.id);
    }
  };

  const handleAddItem = async (produtoId: number) => {
    if (!selectedId) return;
    const res = await addOrcamentoItem(selectedId, produtoId, 1, orcamentoDetalhe.mk_padrao || 3.0);
    if (res.success) {
      setIsAddItemModalOpen(false);
      loadDetalhes(selectedId);
    }
  };

  const handleDelete = async (id: number | null) => {
    if (!id) return;
    if (confirm('Excluir este orçamento permanentemente?')) {
      const res = await deleteOrcamento(id);
      if (res.success) {
        setSelectedId(null);
        loadOrcamentos();
      }
    }
  };

  // --- VIEW: LIST ---
  if (!selectedId) {
    return (
      <div className="card-premium p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Propostas Comerciais</h2>
            <p className="text-sm text-muted-custom">Gestão de orçamentos no Neon Database</p>
          </div>
          <button onClick={() => setIsNewOrcModalOpen(true)} className="btn-premium">
            <span className="text-lg">+</span> Nova Proposta Industrial
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-custom">Carregando orçamentos...</div>
        ) : orcamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-dark/30 rounded-xl border border-dashed border-border-custom">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 shadow-inner border border-border-custom">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sem Orçamentos</h3>
            <button onClick={() => setIsNewOrcModalOpen(true)} className="mt-4 btn-premium">Criar Primeiro Orçamento</button>
          </div>
        ) : (
          <div className="table-container shadow-2xl">
            <table>
              <thead>
                <tr>
                  <th>Cliente / Projeto</th>
                  <th>Emissão</th>
                  <th className="text-right">Valor Final</th>
                  <th className="w-32 text-center">Status</th>
                  <th className="w-24 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map(orc => (
                  <tr key={orc.id} className="group">
                    <td>
                      <div className="font-bold text-white leading-tight">{orc.cliente}</div>
                      <div className="text-[10px] text-muted-custom uppercase mt-1">Ref ID: #{orc.id}</div>
                    </td>
                    <td className="text-muted-custom font-medium">
                      {new Date(orc.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="text-right">
                      <div className="text-sm font-black text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orc.total || 0)}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge-premium badge-green">{orc.status}</span>
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => setSelectedId(orc.id)}
                        className="px-3 py-1 bg-surface border border-border-custom rounded text-xs font-bold text-white hover:border-primary transition-colors"
                      >
                        ABRIR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Novo Orçamento */}
        {isNewOrcModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="card-premium w-full max-w-md p-8">
              <h3 className="text-xl font-bold text-white mb-6">Iniciar Novo Orçamento</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Nome do Cliente / Obra</label>
                  <input 
                    required 
                    type="text" 
                    value={newCliente} 
                    onChange={(e) => setNewCliente(e.target.value.toUpperCase())}
                    placeholder="EX: RESIDENCIAL SAFIRA - APTO 402"
                    className="w-full uppercase"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsNewOrcModalOpen(false)} className="flex-1 btn-ghost py-2 rounded-lg">Cancelar</button>
                  <button type="submit" className="flex-[2] btn-premium py-2 justify-center rounded-lg">Criar Proposta</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: DETAILS (BOM) ---
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedId(null)} className="btn-ghost px-4 py-2 rounded-lg">← Voltar</button>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
          PROPOSTA: <span className="text-primary">{orcamentoDetalhe?.cliente}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white">Composição do Projeto (BOM)</h3>
              <button 
                onClick={() => { loadEstoque(); setIsAddItemModalOpen(true); }}
                className="btn-premium py-2 text-xs"
              >
                + Adicionar Item do Estoque
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qtd</th>
                    <th className="text-right">Unitário</th>
                    <th className="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {!orcamentoDetalhe?.itens || orcamentoDetalhe.itens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-custom italic">Nenhum item adicionado</td>
                    </tr>
                  ) : (
                    orcamentoDetalhe.itens.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-bold text-white text-xs">{item.produto.descricao}</div>
                          <div className="text-[9px] text-muted-custom font-mono">{item.produto.sku}</div>
                        </td>
                        <td className="text-center font-bold text-white">{item.quantidade}</td>
                        <td className="text-right text-xs text-muted-custom">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_venda)}
                        </td>
                        <td className="text-right font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_venda * item.quantidade)}
                        </td>
                        <td className="text-center text-red-500 cursor-pointer hover:text-white">✕</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-premium p-6 border-t-4 border-t-primary">
            <h3 className="font-bold text-white mb-4">Resumo Financeiro</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-custom">Total Insumos:</span>
                <span className="text-white font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    orcamentoDetalhe?.itens?.reduce((sum: number, i: any) => sum + (i.produto.preco_custo * i.quantidade), 0) || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-custom">Markup Médio:</span>
                <span className="text-success font-bold">{orcamentoDetalhe?.mk_padrao?.toFixed(2)}x</span>
              </div>
              <div className="h-px bg-border-custom my-4"></div>
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase font-bold text-muted-custom">Valor da Proposta</span>
                <span className="text-3xl font-black text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    orcamentoDetalhe?.itens?.reduce((sum: number, i: any) => sum + (i.preco_venda * i.quantidade), 0) || 0
                  )}
                </span>
              </div>
              <button className="w-full btn-premium justify-center py-4 mt-6 uppercase tracking-widest text-xs">
                Gerar PDF Industrial
              </button>
              <button onClick={() => handleDelete(selectedId)} className="w-full text-[10px] text-red-500/50 hover:text-red-500 mt-4 transition-colors">
                Excluir Orçamento Permanentemente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Item do Estoque */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-premium w-full max-w-2xl p-8 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Selecionar Insumo do Estoque</h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-muted-custom hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="table-container flex-1">
              <table>
                <thead>
                  <tr>
                    <th>SKU / Descrição</th>
                    <th className="text-right">Custo</th>
                    <th className="w-20 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {estoque.map(prod => (
                    <tr key={prod.id} className="hover:bg-primary/10">
                      <td>
                        <div className="font-bold text-white text-xs">{prod.descricao}</div>
                        <div className="text-[9px] text-muted-custom">{prod.sku}</div>
                      </td>
                      <td className="text-right text-xs font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco_custo)}
                      </td>
                      <td className="text-center">
                        <button 
                          onClick={() => handleAddItem(prod.id)}
                          className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded hover:scale-105 transition-transform"
                        >
                          ADD
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
