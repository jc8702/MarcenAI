// src/components/Header.tsx
import React from 'react';

export default function Header() {
  return (
    <header className="flex justify-between items-center bg-surface border-b border-border p-6 rounded-xl mb-8 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src="/logo.png" 
            alt="D'Luxury Logo" 
            className="h-12 w-auto filter drop-shadow-[0_2px_8px_rgba(255,99,31,0.3)] transition-transform hover:scale-105"
          />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white">
            MARCEN<span className="text-primary italic">AI</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-custom font-bold">
            Industrial Premium System
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-custom uppercase tracking-widest font-bold">Unidade Fabril</p>
            <p className="text-xs text-white font-black">MATRIZ 01</p>
          </div>
        </div>
      </div>
    </header>
  );
}
