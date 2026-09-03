// Tipos centralizados para Workspace

export type WorkspaceId = 'gstore' | 'pwlabs' | 'acto' | 'pessoal';

// Configuração de cada workspace
export interface WorkspaceConfig {
  id: WorkspaceId;
  label: string;
  icon: 'shopping-bag' | 'briefcase' | 'layers' | 'user' | 'wallet';
  color: string;
}

// Lista de workspaces disponíveis
export const WORKSPACES: WorkspaceConfig[] = [
  { id: 'gstore', label: 'G-Store', icon: 'shopping-bag', color: 'purple' },
  { id: 'pwlabs', label: 'PW Labs', icon: 'briefcase', color: 'blue' },
  { id: 'acto', label: 'Acto', icon: 'layers', color: 'orange' },
  { id: 'pessoal', label: 'Pessoal', icon: 'wallet', color: 'emerald' },
];

// Storage key para persistência
export const WORKSPACE_STORAGE_KEY = 'jarvis-active-workspace';
