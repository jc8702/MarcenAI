// src/app/page.tsx
'use client';

import { useState } from 'react';
import EstoqueModule from '@/components/EstoqueModule';
import OrcamentosModule from '@/components/OrcamentosModule';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'estoque' | 'orcamentos'>('estoque');

  return (
    <main>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid var(--border)'
      }}>
        <button 
          className={`tab ${activeTab === 'estoque' ? 'active' : ''}`}
          onClick={() => setActiveTab('estoque')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: activeTab === 'estoque' ? 'var(--teal)' : 'var(--text-muted)',
            cursor: 'pointer',
            borderBottom: activeTab === 'estoque' ? '3px solid var(--teal)' : '3px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Estoque
        </button>
        <button 
          className={`tab ${activeTab === 'orcamentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('orcamentos')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: activeTab === 'orcamentos' ? 'var(--teal)' : 'var(--text-muted)',
            cursor: 'pointer',
            borderBottom: activeTab === 'orcamentos' ? '3px solid var(--teal)' : '3px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Oramentos
        </button>
      </div>

      {activeTab === 'estoque' ? <EstoqueModule /> : <OrcamentosModule />}
    </main>
  );
}
