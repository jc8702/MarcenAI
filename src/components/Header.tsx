// src/components/Header.tsx
import React from 'react';

export default function Header() {
  return (
    <header style={{
      background: 'var(--navy)',
      color: 'white',
      padding: '24px 32px',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'var(--gold)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--navy)'
        }}>D'L</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          D'Luxury - Gestão Comercial
        </h1>
      </div>
    </header>
  );
}
