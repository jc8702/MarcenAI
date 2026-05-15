// src/components/Sidebar.tsx
'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  ChevronRight, 
  ChevronLeft,
  Package,
  FileSpreadsheet,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ 
  activeModule, 
  setActiveModule, 
  isCollapsed, 
  setIsCollapsed 
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estoque', label: 'Insumos / Estoque', icon: Package },
    { id: 'orcamentos', label: 'Orçamentos BOM', icon: FileSpreadsheet },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-surface border-r border-border-custom transition-all duration-300 z-50 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Toggle Button - Agora na DIREITA da sidebar */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-10 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-dark shadow-lg hover:scale-110 transition-transform cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Profile / Header Area */}
      <div className={`p-6 border-b border-border-custom flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
        <div className="w-10 h-10 rounded-full bg-surface border border-primary/30 flex items-center justify-center text-primary font-bold">
          AD
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Admin Fábrica</p>
            <p className="text-[10px] text-muted-custom uppercase tracking-wider">Marcenaria Premium</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-custom hover:bg-white/5 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'gap-4'}`}
            >
              <Icon size={22} className={isActive ? 'text-primary' : 'group-hover:text-primary'} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#FF631F]"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 w-full p-4 border-t border-border-custom space-y-2">
        <button className={`w-full flex items-center p-3 text-muted-custom hover:text-white transition-all ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
          <Settings size={22} />
          {!isCollapsed && <span className="text-sm">Configurações</span>}
        </button>
        <button className={`w-full flex items-center p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
          <LogOut size={22} />
          {!isCollapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
