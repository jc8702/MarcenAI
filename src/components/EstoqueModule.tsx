import React, { useState, useEffect, useRef } from 'react';
import { getEstoque, upsertProduto, deleteProduto, deleteProdutosEmMassa, importEstoqueEmMassa } from '@/actions/estoque';

const FAMILIAS = [
  'FERRAGENS', 'MDF', 'ACABAMENTOS', 'ILUMINAÇÃO', 'VIDROS', 'METAIS', 'ACESSÓRIOS', 'SERVIÇOS', 'OUTROS'
];

export default function EstoqueModule() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamilia, setFilterFamilia] = useState('TODAS');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    sku: '',
    descricao: '',
    familia: 'MDF',
    unidade: 'UN',
    marca: '',
    fornecedor: '',
    codigoFornecedor: '',
    preco_custo: 0
  });

  const loadData = async () => {
    setLoading(true);
    const res = await getEstoque();
    if (res.success) {
      setEstoque(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await importEstoqueEmMassa(formData);
    if (res.success) {
      alert(`${res.count} itens importados com sucesso!`);
      loadData();
    } else {
      alert('Erro ao importar: ' + res.error);
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await upsertProduto(editingItem ? { ...formData, id: editingItem.id } : formData);
    if (res.success) {
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ 
        sku: '', 
        descricao: '', 
        familia: 'MDF', 
        unidade: 'UN', 
        marca: '', 
        fornecedor: '', 
        codigoFornecedor: '', 
        preco_custo: 0 
      });
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      const res = await deleteProduto(id);
      if (res.success) loadData();
    }
  };

  const handleDeleteMassa = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Deseja excluir os ${selectedIds.length} itens selecionados?`)) {
      const res = await deleteProdutosEmMassa(selectedIds);
      if (res.success) {
        setSelectedIds([]);
        loadData();
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === estoqueFiltrado.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(estoqueFiltrado.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sku: item.sku,
        descricao: item.descricao,
        familia: item.familia,
        unidade: item.unidade,
        marca: item.marca || '',
        fornecedor: item.fornecedor || '',
        codigoFornecedor: item.codigoFornecedor || '',
        preco_custo: item.preco_custo
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        sku: '', 
        descricao: '', 
        familia: 'MDF', 
        unidade: 'UN', 
        marca: '', 
        fornecedor: '', 
        codigoFornecedor: '', 
        preco_custo: 0 
      });
    }
    setIsModalOpen(true);
  };

  const estoqueFiltrado = estoque.filter(item => {
    const matchSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFamilia = filterFamilia === 'TODAS' || item.familia === filterFamilia;
    return matchSearch && matchFamilia;
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-6 border-l-4 border-l-primary">
          <p className="text-[10px] uppercase tracking-widest text-muted-custom font-bold mb-1">Total de Itens Catalogados</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{estoque.length}</span>
            <span className="text-xs text-success font-bold">+12% este mês</span>
          </div>
        </div>
        
        <div className="card-premium p-6 border-l-4 border-l-success">
          <p className="text-[10px] uppercase tracking-widest text-muted-custom font-bold mb-1">Valor Total em Ativos</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estoque.reduce((sum, i) => sum + i.preco_custo, 0))}
            </span>
            <span className="text-xs text-primary font-bold">Investimento</span>
          </div>
        </div>
      </div>

      {/* Main Inventory Card */}
      <div className="card-premium p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Inventário</h2>
            <p className="text-sm text-muted-custom">Controle de insumos e matérias-primas industriais</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedIds.length > 0 && (
              <button 
                onClick={handleDeleteMassa}
                className="px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-[10px] uppercase font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                🗑️ Excluir ({selectedIds.length})
              </button>
            )}
            <a 
              href="/Modelo_Importacao_MarcenAI.csv" 
              download 
              className="px-4 py-2 bg-dark/50 border border-border-custom rounded-lg text-[10px] uppercase font-bold text-muted-custom hover:border-primary hover:text-white transition-all flex items-center gap-2"
            >
              📥 Modelo
            </a>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-4 py-2 bg-surface border border-border-custom rounded-lg text-[10px] uppercase font-bold text-white hover:bg-primary/20 hover:border-primary transition-all flex items-center gap-2"
            >
              📊 Importar Excel
            </button>
            <button onClick={() => openModal()} className="btn-premium">
              <span className="text-lg">+</span> Novo Item
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-dark/50 rounded-lg border border-border-custom">
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder="Pesquisar por descrição, SKU, marca ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 bg-surface border-border-custom focus:border-primary text-sm h-11"
            />
          </div>
          <select 
            value={filterFamilia} 
            onChange={(e) => setFilterFamilia(e.target.value)} 
            className="w-full sm:w-64 bg-surface border-border-custom focus:border-primary text-sm h-11"
          >
            <option value="TODAS">Todas as Famílias</option>
            {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Inventory Table */}
        <div className="table-container shadow-2xl overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-muted-custom">Carregando dados do Neon...</div>
          ) : (
            <table className="min-w-[1000px]">
              <thead>
                <tr>
                  <th className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === estoqueFiltrado.length && estoqueFiltrado.length > 0} 
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="w-32">SKU</th>
                  <th>Descrição do Insumo</th>
                  <th className="w-32">Marca</th>
                  <th className="w-32">Fornecedor</th>
                  <th className="w-40">Classificação</th>
                  <th className="w-40 text-right">Custo Unitário</th>
                  <th className="w-24 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {estoqueFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20 text-muted-custom italic">
                      Nenhum item encontrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  estoqueFiltrado.map(item => (
                    <tr key={item.id} className={`group ${selectedIds.includes(item.id) ? 'bg-primary/5' : ''}`}>
                      <td className="text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)} 
                          onChange={() => toggleSelectOne(item.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td>
                        <span className="badge-premium badge-orange font-mono tracking-tighter">
                          {item.sku}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-white leading-tight">{item.descricao}</div>
                        <div className="text-[10px] text-muted-custom uppercase mt-1">Ref ID: #{item.id} | Cod. Forn: {item.codigoFornecedor || 'N/A'}</div>
                      </td>
                      <td className="text-muted-custom text-xs font-bold">{item.marca || '-'}</td>
                      <td className="text-muted-custom text-xs font-bold">{item.fornecedor || '-'}</td>
                      <td>
                        <span className="badge-premium badge-green">
                          {item.familia}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="text-sm font-black text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_custo)}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => openModal(item)}
                            className="text-primary hover:text-white transition-colors"
                            title="Editar"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-white transition-colors"
                            title="Excluir"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="card-premium w-full max-w-2xl p-8 shadow-2xl border-primary/20 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingItem ? 'Editar Insumo Industrial' : 'Novo Registro de Estoque'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-custom hover:text-white text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">SKU / Código</label>
                  <input 
                    required
                    type="text" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    placeholder="EX: MDF-18-BR"
                    className="uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Família</label>
                  <select 
                    value={formData.familia} 
                    onChange={(e) => setFormData({...formData, familia: e.target.value})}
                  >
                    {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-muted-custom">Descrição Completa</label>
                <input 
                  required
                  type="text" 
                  value={formData.descricao} 
                  onChange={(e) => setFormData({...formData, descricao: e.target.value.toUpperCase()})}
                  placeholder="EX: CHAPA MDF 18MM BRANCO TX"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Marca</label>
                  <input 
                    type="text" 
                    value={formData.marca} 
                    onChange={(e) => setFormData({...formData, marca: e.target.value.toUpperCase()})}
                    placeholder="EX: DURATEX"
                    className="uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Fornecedor</label>
                  <input 
                    type="text" 
                    value={formData.fornecedor} 
                    onChange={(e) => setFormData({...formData, fornecedor: e.target.value.toUpperCase()})}
                    placeholder="EX: MADEIRANIT"
                    className="uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Cód. Fornecedor</label>
                  <input 
                    type="text" 
                    value={formData.codigoFornecedor} 
                    onChange={(e) => setFormData({...formData, codigoFornecedor: e.target.value.toUpperCase()})}
                    placeholder="EX: 99827"
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Unidade</label>
                  <input 
                    required
                    type="text" 
                    value={formData.unidade} 
                    onChange={(e) => setFormData({...formData, unidade: e.target.value.toUpperCase()})}
                    placeholder="EX: UN, M2, BARRA..."
                    className="uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Preço de Custo (R$)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.preco_custo} 
                    onChange={(e) => setFormData({...formData, preco_custo: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-ghost py-3 rounded-lg font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] btn-premium py-3 justify-center rounded-lg shadow-lg">
                  {editingItem ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
