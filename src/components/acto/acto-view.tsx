'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Leaf, Building2, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActoViewProps {
  userId: string;
}

interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  plataforma: 'Flora' | 'CityPro';
  status: 'ativo' | 'backlog' | 'em-progresso' | 'concluido';
  demandasCount: number;
}

const projetos: Projeto[] = [
  {
    id: 'flora',
    nome: 'Flora',
    descricao: 'Plataforma de gestão ambiental e sustentabilidade',
    plataforma: 'Flora',
    status: 'ativo',
    demandasCount: 12,
  },
  {
    id: 'citypro',
    nome: 'CityPro',
    descricao: 'Plataforma de gestão urbana e municipal',
    plataforma: 'CityPro',
    status: 'ativo',
    demandasCount: 8,
  },
];

export function ActoView({ userId }: ActoViewProps) {
  const getStatusBadge = (status: Projeto['status']) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Ativo</Badge>;
      case 'backlog':
        return <Badge variant="secondary">Backlog</Badge>;
      case 'em-progresso':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400">Em Progresso</Badge>;
      case 'concluido':
        return <Badge variant="outline">Concluído</Badge>;
    }
  };

  const getPlataformaIcon = (plataforma: Projeto['plataforma']) => {
    return plataforma === 'Flora' ? (
      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
        <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Layers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Acto</h1>
            <p className="text-sm text-muted-foreground">Gestão de Produtos & UX</p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Demanda
        </Button>
      </div>

      {/* Lista de Projetos */}
      <div className="grid gap-4">
        {projetos.map((projeto) => (
          <Card key={projeto.id} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getPlataformaIcon(projeto.plataforma)}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {projeto.nome}
                      {getStatusBadge(projeto.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{projeto.descricao}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {projeto.demandasCount} demandas
                  </span>
                </div>
                <span className="text-sm font-medium text-primary">
                  Ver demandas →
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state se não houver projetos */}
      {projetos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure seus projetos (Flora, CityPro) para acompanhar demandas e sprints.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Projeto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
