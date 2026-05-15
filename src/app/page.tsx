// src/app/page.tsx
'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import EstoqueModule from '@/components/EstoqueModule';
import OrcamentosModule from '@/components/OrcamentosModule';
import { LayoutDashboard, BarChart3, Construction } from 'lucide-react';

type ModuleType = 'dashboard' | 'estoque' | 'orcamentos' | 'relatorios';

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>('estoque');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] card-premium p-12 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <LayoutDashboard size={40} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 italic">DASHBOARD INDUSTRIAL</h2>
            <p className="text-muted-custom max-w-md">
              Módulo em fase de calibração. Em breve você terá acesso a métricas de faturamento, giro de estoque e KPIs de produção.
            </p>
          </div>
        );
      case 'estoque':
        return <EstoqueModule />;
      case 'orcamentos':
        return <OrcamentosModule />;
      case 'relatorios':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] card-premium p-12 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mb-6">
              <BarChart3 size={40} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 italic">CENTRAL DE RELATÓRIOS</h2>
            <p className="text-muted-custom max-w-md">
              Estamos estruturando os motores de exportação. Em breve: Listas de Corte, BOM Export e Curva ABC de Insumos.
            </p>
          </div>
        );
      default:
        return <EstoqueModule />;
    }
  };

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden flex">
      {/* Sidebar - Fixada na esquerda */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 transition-all duration-300" 
        style={{ marginLeft: isCollapsed ? '80px' : '288px' }}
      >
        <div className="max-w-full mx-auto p-4 md:p-8 px-6 md:px-12">
          <Header />
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
