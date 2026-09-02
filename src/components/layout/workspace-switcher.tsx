'use client';

import React from 'react';
import { Building2, ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Workspace } from '@/types/crm';

interface WorkspaceSwitcherProps {
  workspaceAtivo: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  contadores?: {
    gstore: number;
    pwlabs: number;
    pessoal: number;
  };
}

export function WorkspaceSwitcher({
  workspaceAtivo,
  onWorkspaceChange,
  contadores = { gstore: 0, pwlabs: 0, pessoal: 0 }
}: WorkspaceSwitcherProps) {
  return (
    <Select value={workspaceAtivo} onValueChange={(v) => onWorkspaceChange(v as Workspace)}>
      <SelectTrigger className="w-[180px] gap-2">
        <SelectValue placeholder="Selecionar workspace" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pwlabs" className="gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>PW Labs</span>
            {contadores.pwlabs > 0 && (
              <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs">
                {contadores.pwlabs}
              </span>
            )}
          </div>
        </SelectItem>
        <SelectItem value="gstore" className="gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-purple-500" />
            <span>G-Store</span>
            {contadores.gstore > 0 && (
              <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs">
                {contadores.gstore}
              </span>
            )}
          </div>
        </SelectItem>
        <SelectItem value="pessoal" className="gap-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-500" />
            <span>Pessoal</span>
            {contadores.pessoal > 0 && (
              <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs">
                {contadores.pessoal}
              </span>
            )}
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
