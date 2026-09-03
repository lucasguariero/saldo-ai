'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkspaceId } from '@/types/workspace';
import { TipoIntento } from '@/types/crm';

interface TriageCardProps {
  resultado: {
    tipo: TipoIntento;
    transcricao?: string;
    confianca?: number;
    dados: any;
  };
  onConfirm: (workspaceOverride?: WorkspaceId) => Promise<void>;
  onCancel: () => void;
  autoConfirmDelay?: number;
}

const WORKSPACE_MAP: Record<string, { workspace: WorkspaceId; emoji: string; label: string }> = {
  'GSTORE_REVENDA': { workspace: 'gstore', emoji: '🛍️', label: 'G-Store (Revenda)' },
  'GSTORE_AFILIADO': { workspace: 'gstore', emoji: '🛍️', label: 'G-Store (Afiliado)' },
  'PWLABS_DEAL': { workspace: 'pwlabs', emoji: '🏢', label: 'PW Labs' },
  'ACTO_DEMANDA': { workspace: 'acto', emoji: '🎯', label: 'Acto' },
  'PESSOAL_FINANCE': { workspace: 'pessoal', emoji: '💰', label: 'Pessoal (Finance)' },
  'PESSOAL_TAREFA': { workspace: 'pessoal', emoji: '📝', label: 'Pessoal (Tarefa)' },
};

export function TriageCard({ resultado, onConfirm, onCancel, autoConfirmDelay = 5000 }: TriageCardProps) {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(autoConfirmDelay / 1000);
  const [workspaceOverride, setWorkspaceOverride] = useState<WorkspaceId | null>(null);

  const mapped = WORKSPACE_MAP[resultado.tipo] || { workspace: 'pessoal' as WorkspaceId, emoji: '❓', label: 'Pessoal' };
  const effectiveWorkspace = workspaceOverride || mapped.workspace;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) handleConfirm();
  }, [countdown]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(workspaceOverride || undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceChange = (newWorkspace: WorkspaceId) => {
    setWorkspaceOverride(newWorkspace);
  };

  const gerarResumo = () => {
    const { dados, tipo } = resultado;

    switch (tipo) {
      case 'GSTORE_REVENDA':
        if (dados.produto) {
          return `${dados.produto.titulo} - Custo: R$ ${dados.produto.custo_aquisicao?.toFixed(2)}`;
        }
        return dados.afiliado?.titulo || 'Produto';

      case 'GSTORE_AFILIADO':
        if (dados.afiliado) {
          return `${dados.afiliado.titulo} - Loja: ${dados.afiliado.loja_afiliada}`;
        }
        return 'Afiliado';

      case 'PWLABS_DEAL':
        if (dados.deal) {
          return `${dados.deal.titulo_deal || dados.deal.empresa} - R$ ${dados.deal.valor_estimado?.toFixed(2)}`;
        }
        return 'Deal';

      case 'ACTO_DEMANDA':
        if (dados.demanda) {
          return `[${dados.demanda.projeto?.toUpperCase()}] ${dados.demanda.titulo}`;
        }
        return 'Demanda';

      case 'PESSOAL_FINANCE':
        if (dados.transacao) {
          const emoji = dados.transacao.tipo === 'ENTRADA' ? '📥' : '📤';
          return `${emoji} ${dados.transacao.descricao} - R$ ${dados.transacao.valor?.toFixed(2)}`;
        }
        return 'Transação';

      case 'PESSOAL_TAREFA':
        if (dados.tarefa) {
          return `📝 ${dados.tarefa.titulo}`;
        }
        return 'Tarefa';

      default:
        return 'Item';
    }
  };

  return (
    <div className="bg-card border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-top-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{mapped.emoji}</span>
          <Badge variant="outline" className="font-medium">
            {mapped.label}
          </Badge>
        </div>

        <Select value={effectiveWorkspace} onValueChange={(v) => handleWorkspaceChange(v as WorkspaceId)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Mudar workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gstore">🛍️ G-Store</SelectItem>
            <SelectItem value="pwlabs">🏢 PW Labs</SelectItem>
            <SelectItem value="acto">🎯 Acto</SelectItem>
            <SelectItem value="pessoal">👤 Pessoal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted/50 rounded-md p-3">
        <p className="text-sm text-foreground">{gerarResumo()}</p>
        {resultado.transcricao && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            &quot;{resultado.transcricao}&quot;
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Confiança: {Math.round((resultado.confianca || 0.8) * 100)}%</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Auto-confirmar em {countdown}s
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Confirmar
        </Button>
        <Button onClick={onCancel} variant="outline" className="gap-2">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
