'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Briefcase,
  Layers,
  Wallet,
  Plus,
  Camera,
  Search,
  ArrowRight
} from 'lucide-react';
import { WorkspaceId } from '@/types/workspace';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkspace: (id: WorkspaceId) => void;
  onOpenNewTransaction: () => void;
  onOpenOCR: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectWorkspace,
  onOpenNewTransaction,
  onOpenOCR,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      group: 'Navegação de Workspaces',
      items: [
        { id: 'gstore', label: 'Ir para G-Store (Estoque & Afiliados)', icon: ShoppingBag, color: 'text-purple-500', action: () => onSelectWorkspace('gstore') },
        { id: 'pwlabs', label: 'Ir para PW Labs (Pipeline & Marketing)', icon: Briefcase, color: 'text-blue-500', action: () => onSelectWorkspace('pwlabs') },
        { id: 'acto', label: 'Ir para Acto (Design & Front-end)', icon: Layers, color: 'text-orange-500', action: () => onSelectWorkspace('acto') },
        { id: 'pessoal', label: 'Ir para Pessoal (Tesouraria & Saldo)', icon: Wallet, color: 'text-emerald-500', action: () => onSelectWorkspace('pessoal') },
      ]
    },
    {
      group: 'Ações Rápidas',
      items: [
        { id: 'new-tx', label: 'Nova Transação Financeira Manual', icon: Plus, color: 'text-emerald-500', action: onOpenNewTransaction },
        { id: 'ocr-batch', label: 'Escanear Extrato Bancário / Fatura (OCR)', icon: Camera, color: 'text-indigo-500', action: onOpenOCR },
      ]
    }
  ];

  const filteredGroups = actions.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Digite um comando ou busque um workspace... (Esc para fechar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum comando encontrado para "{query}"
            </div>
          ) : (
            filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {group.group}
                </span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-foreground hover:bg-secondary/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border text-[11px] text-muted-foreground">
          <span>Navegue com o mouse ou atalhos</span>
          <div className="flex items-center gap-1 font-mono">
            <span className="bg-background px-1.5 py-0.5 rounded border border-border">⌘K</span> para abrir
          </div>
        </div>
      </div>
    </div>
  );
}
