// src/components/EstoqueModule.tsx
'use client';

import React, { useState, useEffect } from 'react';

const FAMILIAS = [
  'FERRAGENS', 'MDF', 'ACABAMENTOS', 'ILUMINAÇÃO', 'VIDROS', 'METAIS', 'ACESSÓRIOS', 'SERVIÇOS', 'OUTROS'
];

export default function EstoqueModule() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamilia, setFilterFamilia] = useState('TODAS');

  useEffect(() => {
    // Aqui viria a busca no banco de dados (Neon)
    // Por enquanto, usaremos os dados iniciais como placeholder
    const saved = localStorage.getItem('dluxury_estoque');
    if (saved) setEstoque(JSON.parse(saved));
  }, []);

  const estoqueFiltrado = estoque.filter(item => {
    const matchSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFamilia = filterFamilia === 'TODAS' || item.familia === filterFamilia;
    return matchSearch && matchFamilia;
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #0A1828 100%)', color: 'white', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>Total de Itens</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{estoque.length}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #0A1828 100%)', color: 'white', padding: '20px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>Valor em Estoque</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estoque.reduce((sum, i) => sum + i.preco_custo, 0))}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>Gestão de Estoque</h2>
          <button className="btn">+ Novo Item</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input 
            type="text"
            placeholder="Buscar por descrição ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={filterFamilia} onChange={(e) => setFilterFamilia(e.target.value)} style={{ width: '200px' }}>
            <option value="TODAS">Todas as famílias</option>
            {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Descrição</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Família</th>
              <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Preço Custo</th>
            </tr>
          </thead>
          <tbody>
            {estoqueFiltrado.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}><span className="sku-badge">{item.sku}</span></td>
                <td style={{ padding: '12px' }}>{item.descricao}</td>
                <td style={{ padding: '12px' }}><span className="badge badge-familia">{item.familia}</span></td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_custo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
