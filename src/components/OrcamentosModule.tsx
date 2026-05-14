// src/components/OrcamentosModule.tsx
'use client';

import React, { useState, useEffect } from 'react';

export default function OrcamentosModule() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('dluxury_orcamentos');
    if (saved) setOrcamentos(JSON.parse(saved));
  }, []);

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>Oramentos</h2>
        <button className="btn">+ Novo Oramento</button>
      </div>

      {orcamentos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p>Nenhum oramento criado ainda</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Data</th>
              <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Total</th>
              <th style={{ borderBottom: '2px solid var(--border)' }}></th>
            </tr>
          </thead>
          <tbody>
            {orcamentos.map(orc => (
              <tr key={orc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>{orc.cliente}</td>
                <td style={{ padding: '12px' }}>{new Date(orc.data).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orc.total || 0)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Abrir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
