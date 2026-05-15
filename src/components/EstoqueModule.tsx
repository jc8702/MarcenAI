import React, { useState, useEffect, useRef } from 'react';
import { 
  getEstoque, 
  upsertProduto, 
  deleteProduto, 
  deleteProdutosEmMassa, 
  importEstoqueEmMassa,
  getFamilias,
  upsertFamilia,
  gerarSugestaoSku,
  getHistoricoProduto
} from '@/actions/estoque';

export default function EstoqueModule() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamilia, setFilterFamilia] = useState('TODAS');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [itemHistory, setItemHistory] = useState<any[]>([]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  
  const [formData, setFormData] = useState({
    sku: '',
    descricao: '',
    familia: '',
    unidade: 'UN',
    marca: '',
    fornecedor: '',
    codigoFornecedor: '',
    preco_custo: 0
  });

  const [familyData, setFamilyData] = useState({
    nome: '',
    prefixo: '',
    proximoNumero: 1
  });

  const loadData = async () => {
    setLoading(true);
    const [resEstoque, resFamilias] = await Promise.all([getEstoque(), getFamilias()]);
    
    if (resEstoque.success) setEstoque(resEstoque.data || []);
    
    if (resFamilias.success) {
      const fams = resFamilias.data || [];
      setFamilias(fams);
      
      // Se não houver famílias, inicializa com as padrões
      if (fams.length === 0) {
        const defaultFamilies = [
          { nome: 'FERRAGENS', prefixo: 'FERR', proximoNumero: 1001 },
          { nome: 'MDF', prefixo: 'MDF', proximoNumero: 1001 },
          { nome: 'ACABAMENTOS', prefixo: 'ACAB', proximoNumero: 1001 },
          { nome: 'ILUMINAÇÃO', prefixo: 'ILUM', proximoNumero: 1001 },
          { nome: 'VIDROS', prefixo: 'VIDR', proximoNumero: 1001 },
          { nome: 'METAIS', prefixo: 'META', proximoNumero: 1001 },
          { nome: 'ACESSÓRIOS', prefixo: 'ACES', proximoNumero: 1001 },
          { nome: 'SERVIÇOS', prefixo: 'SERV', proximoNumero: 1001 },
          { nome: 'OUTROS', prefixo: 'OUTR', proximoNumero: 1001 },
        ];
        for (const f of defaultFamilies) {
          await upsertFamilia(f);
        }
        const resReload = await getFamilias();
        if (resReload.success) setFamilias(resReload.data || []);
      }
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
    const formDataImport = new FormData();
    formDataImport.append('file', file);
    
    const res = await importEstoqueEmMassa(formDataImport);
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
    
    let familiaFinal = formData.familia;

    if (isAddingFamily && familyData.nome && familyData.prefixo) {
      const resFam = await upsertFamilia(familyData);
      if (!resFam.success) {
        alert('Erro ao criar família: ' + resFam.error);
        return;
      }
      familiaFinal = familyData.nome.toUpperCase();
    }

    const res = await upsertProduto(editingItem ? { ...formData, id: editingItem.id, familia: familiaFinal } : { ...formData, familia: familiaFinal });
    if (res.success) {
      setIsModalOpen(false);
      setEditingItem(null);
      setIsAddingFamily(false);
      setFormData({ 
        sku: '', 
        descricao: '', 
        familia: familias[0]?.nome || '', 
        unidade: 'UN', 
        marca: '', 
        fornecedor: '', 
        codigoFornecedor: '', 
        preco_custo: 0 
      });
      loadData();
    } else {
      alert('Erro ao salvar item: ' + res.error);
    }
  };

  const handleSuggestSku = async () => {
    if (!formData.familia) {
      alert('Selecione uma família primeiro.');
      return;
    }
    const res = await gerarSugestaoSku(formData.familia);
    if (res.success) {
      setFormData(prev => ({ ...prev, sku: res.sku || '' }));
    } else {
      alert('Erro: ' + res.error);
    }
  };

  const handleFamilyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setIsAddingFamily(true);
      setFormData({ ...formData, familia: '' });
    } else {
      setIsAddingFamily(false);
      setFormData(prev => ({ ...prev, familia: val }));
      
      // Auto-sugerir SKU ao trocar de família se for um novo item ou se o usuário estiver editando e mudar a família
      const res = await gerarSugestaoSku(val);
      if (res.success && res.sku) {
        setFormData(prev => ({ ...prev, sku: res.sku || '' }));
      }
    }
  };

  const suggestFamilyMetadata = (name: string) => {
    const clean = name.trim().toUpperCase();
    const prefix = clean.substring(0, 4).replace(/[^A-Z]/g, '');
    const nextNum = 1001;
    
    setFamilyData(prev => ({ 
      ...prev, 
      nome: clean, 
      prefixo: prefix,
      proximoNumero: nextNum
    }));

    // Preenche o SKU automaticamente baseado na nova família sendo criada
    if (prefix) {
      setFormData(prev => ({ ...prev, sku: `${prefix}-${nextNum}` }));
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

  const openModal = async (item?: any) => {
    setIsAddingFamily(false);
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
      
      // Buscar histórico
      setItemHistory([]);
      const res = await getHistoricoProduto(item.id);
      if (res.success && res.data) {
        setItemHistory(res.data);
      }
    } else {
      setEditingItem(null);
      setItemHistory([]);
      setFormData({ 
        sku: '', 
        descricao: '', 
        familia: familias[0]?.nome || '', 
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
                      (item.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.codigoFornecedor || '').toLowerCase().includes(searchTerm.toLowerCase());
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
              placeholder="Pesquisar por descrição, SKU, marca, fornecedor ou código..."
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
            {familias.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
          </select>
        </div>

        {/* Inventory Table */}
        <div className="table-container shadow-2xl overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-muted-custom">Carregando dados do Neon...</div>
          ) : (
            <table className="min-w-[1100px]">
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
                  <th className="w-32">Cód. Forn.</th>
                  <th className="w-40">Classificação</th>
                  <th className="w-40 text-right">Custo Unitário</th>
                  <th className="w-24 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {estoqueFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-20 text-muted-custom italic">
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
                        <div className="text-[10px] text-muted-custom uppercase mt-1">Ref ID: #{item.id}</div>
                      </td>
                      <td className="text-muted-custom text-xs font-bold">{item.marca || '-'}</td>
                      <td className="text-muted-custom text-xs font-bold">{item.fornecedor || '-'}</td>
                      <td className="text-muted-custom text-xs font-bold font-mono">
                        {item.codigoFornecedor ? `#${item.codigoFornecedor}` : '-'}
                      </td>
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
                  <label className="text-[10px] uppercase font-bold text-muted-custom">Família</label>
                  <select 
                    required
                    value={isAddingFamily ? 'NEW' : formData.familia} 
                    onChange={handleFamilyChange}
                  >
                    <option value="" disabled>Selecione uma Família</option>
                    {familias.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                    <option value="NEW" className="text-primary font-bold">+ ADICIONAR NOVA FAMÍLIA</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <label className="text-[10px] uppercase font-bold text-muted-custom">SKU / Código</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="text" 
                      value={formData.sku} 
                      onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                      placeholder="MDF-1001"
                      className="uppercase flex-1"
                    />
                    {!editingItem && !isAddingFamily && (
                      <button 
                        type="button"
                        onClick={handleSuggestSku}
                        className="px-3 bg-primary/10 border border-primary/30 rounded text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-all"
                        title="Gerar SKU automático baseado na família"
                      >
                        ✨ GERAR
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isAddingFamily && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] uppercase font-bold text-primary">Configuração da Nova Família</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-muted-custom">Nome</label>
                      <input 
                        type="text" 
                        placeholder="EX: CONVERSOR"
                        value={familyData.nome}
                        onChange={(e) => suggestFamilyMetadata(e.target.value)}
                        className="bg-dark/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-muted-custom">Prefixo SKU</label>
                      <input 
                        type="text" 
                        placeholder="EX: CONV"
                        value={familyData.prefixo}
                        onChange={(e) => setFamilyData({...familyData, prefixo: e.target.value.toUpperCase()})}
                        className="bg-dark/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-muted-custom">Início em</label>
                      <input 
                        type="number" 
                        value={familyData.proximoNumero}
                        onChange={(e) => setFamilyData({...familyData, proximoNumero: parseInt(e.target.value)})}
                        className="bg-dark/50"
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingFamily(false)}
                    className="text-[10px] uppercase font-bold text-muted-custom hover:text-white"
                  >
                    ← Voltar para lista
                  </button>
                </div>
              )}

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

            {editingItem && itemHistory.length > 0 && (
              <div className="mt-8 pt-6 border-t border-primary/20">
                <h4 className="text-sm font-bold text-white mb-4">Histórico de Alterações</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {itemHistory.map((h, i) => (
                    <div key={i} className="bg-dark/30 p-3 rounded-lg border border-border-custom flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-custom font-bold">
                          {new Date(h.alteradoEm).toLocaleString('pt-BR')}
                        </span>
                        <div className="text-[10px] text-muted-custom uppercase">
                          Marca: <span className="text-white">{h.marca || '-'}</span> | 
                          Forn: <span className="text-white">{h.fornecedor || '-'}</span>
                        </div>
                      </div>
                      <div className="text-sm font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(h.preco_custo)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
