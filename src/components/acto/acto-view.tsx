'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers, Leaf, Building2, Wrench, Plus, ArrowRight, CheckCircle2, Circle, Calendar, Flag, X, Copy, Sparkles, Image as ImageIcon, Mic, Loader2, Palette, Code } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProjetoActo, EngineDesign } from '@/types/crm';

interface ActoViewProps {
  userId: string;
}

// Tipos para Demandas
interface Demanda {
  id: string;
  created_at: string;
  user_id: string;
  workspace_id: string;
  projeto: 'inema' | 'eleitores' | 'crm_acto';
  titulo: string;
  descricao?: string;
  status: 'backlog' | 'em_andamento' | 'validacao' | 'entregue';
  prioridade: 'urgente' | 'alta' | 'normal' | 'baixa';
  estimativa?: string;
  sprint?: string;
  concluida: boolean;
}

interface Projeto {
  id: 'inema' | 'eleitores' | 'crm_acto';
  nome: string;
  descricao: string;
  plataforma: 'Inema' | 'Eleitores' | 'CRM Acto';
  icone: React.ReactNode;
  cor: string;
  corBg: string;
}

const PROJETOS: Projeto[] = [
  {
    id: 'inema',
    nome: 'Inema',
    descricao: 'Instituto de Meio Ambiente - Gestão ambiental e licenciamento',
    plataforma: 'Inema',
    icone: <Leaf className="h-5 w-5" />,
    cor: 'text-green-600',
    corBg: 'bg-green-500/20',
  },
  {
    id: 'eleitores',
    nome: 'Eleitores',
    descricao: 'Gestão de relacionamento com eleitores e atendimentos',
    plataforma: 'Eleitores',
    icone: <Building2 className="h-5 w-5" />,
    cor: 'text-blue-600',
    corBg: 'bg-blue-500/20',
  },
  {
    id: 'crm_acto',
    nome: 'CRM Acto',
    descricao: 'Plataforma CRM própria da Acto Digital',
    plataforma: 'CRM Acto',
    icone: <Wrench className="h-5 w-5" />,
    cor: 'text-purple-600',
    corBg: 'bg-purple-500/20',
  },
];

const STATUS_DEMANDA = [
  { id: 'backlog', label: 'Backlog', cor: 'bg-slate-500' },
  { id: 'em_andamento', label: 'Em Andamento', cor: 'bg-blue-500' },
  { id: 'validacao', label: 'Validação', cor: 'bg-amber-500' },
  { id: 'entregue', label: 'Entregue', cor: 'bg-emerald-500' },
];

const PRIORIDADES = [
  { id: 'urgente', label: 'Urgente', cor: 'bg-red-500', texto: 'text-red-600' },
  { id: 'alta', label: 'Alta', cor: 'bg-orange-500', texto: 'text-orange-600' },
  { id: 'normal', label: 'Normal', cor: 'bg-blue-500', texto: 'text-blue-600' },
  { id: 'baixa', label: 'Baixa', cor: 'bg-slate-500', texto: 'text-slate-600' },
];

export function ActoView({ userId }: ActoViewProps) {
  const supabase = createClient();
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [projetoSelecionado, setProjetoSelecionado] = useState<'inema' | 'eleitores' | 'crm_acto'>('inema');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novaDemanda, setNovaDemanda] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'normal' as Demanda['prioridade'],
    estimativa: '',
    sprint: '',
  });

  // Estados para geração de specs de design
  const [engineSelecionada, setEngineSelecionada] = useState<'gemini' | 'claude'>('gemini');
  const [promptBriefing, setPromptBriefing] = useState('');
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [gerandoSpec, setGerandoSpec] = useState(false);
  const [specGerada, setSpecGerada] = useState<{
    especificacao_markdown?: string;
    codigo_tailwind?: string;
    prompt_google_stitch?: string;
    prompt_figma?: string;
  } | null>(null);
  const [isSpecDialogOpen, setIsSpecDialogOpen] = useState(false);

  // Handler para upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemSelecionada(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gerar especificação de design
  const gerarSpec = async () => {
    if (!promptBriefing) return;

    setGerandoSpec(true);
    setSpecGerada(null);

    try {
      const response = await fetch('/api/acto/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto: projetoSelecionado,
          prompt_briefing: promptBriefing,
          imagem_base64: imagemSelecionada || undefined,
          engine: engineSelecionada,
        }),
      });

      const data = await response.json();
      if (data.especificacao_markdown) {
        setSpecGerada(data);
      }
    } catch (error) {
      console.error('Erro ao gerar spec:', error);
    } finally {
      setGerandoSpec(false);
    }
  };

  // Copiar para clipboard
  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
  };

  // Buscar demandas do Supabase
  useEffect(() => {
    async function fetchDemandas() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pessoal_tarefas')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', 'acto')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Mapear para o formato de demanda
        const demandasMapped: Demanda[] = data.map((t: any) => ({
          id: t.id,
          created_at: t.created_at,
          user_id: t.user_id,
          workspace_id: t.workspace_id,
          projeto: t.projeto || 'flora',
          titulo: t.titulo,
          descricao: t.descricao || '',
          status: t.status || 'backlog',
          prioridade: t.prioridade || 'normal',
          estimativa: t.estimativa,
          sprint: t.sprint,
          concluida: t.concluida || false,
        }));
        setDemandas(demandasMapped);
      }
      setLoading(false);
    }

    fetchDemandas();
  }, [userId, supabase]);

  // Filtrar demandas por projeto
  const demandasDoProjeto = useMemo(() => {
    return demandas.filter(d => d.projeto === projetoSelecionado);
  }, [demandas, projetoSelecionado]);

  // Demandas por status
  const demandasPorStatus = useMemo(() => {
    const grouped: Record<string, Demanda[]> = {
      backlog: [],
      em_andamento: [],
      validacao: [],
      entregue: [],
    };

    demandasDoProjeto.forEach(d => {
      grouped[d.status].push(d);
    });

    return grouped;
  }, [demandasDoProjeto]);

  // Contagem por projeto
  const contagemPorProjeto = useMemo(() => {
    const counts: Record<string, number> = { inema: 0, eleitores: 0, crm_acto: 0 };
    demandas.forEach(d => {
      if (d.projeto && d.status !== 'entregue') {
        counts[d.projeto] = (counts[d.projeto] || 0) + 1;
      }
    });
    return counts;
  }, [demandas]);

  // Criar nova demanda
  const handleCriarDemanda = async () => {
    if (!novaDemanda.titulo.trim() || !supabase) return;

    const { data, error } = await supabase
      .from('pessoal_tarefas')
      .insert({
        user_id: userId,
        workspace_id: 'acto',
        projeto: projetoSelecionado,
        titulo: novaDemanda.titulo,
        descricao: novaDemanda.descricao,
        prioridade: novaDemanda.prioridade,
        estimativa: novaDemanda.estimativa || null,
        sprint: novaDemanda.sprint || null,
        status: 'backlog',
        concluida: false,
      })
      .select()
      .single();

    if (!error && data) {
      const nova: Demanda = {
        id: data.id,
        created_at: data.created_at,
        user_id: data.user_id,
        workspace_id: data.workspace_id,
        projeto: (data.projeto || 'flora') as Demanda['projeto'],
        titulo: data.titulo,
        descricao: data.descricao || '',
        status: (data.status || 'backlog') as Demanda['status'],
        prioridade: (data.prioridade || 'normal') as Demanda['prioridade'],
        estimativa: data.estimativa || undefined,
        sprint: data.sprint || undefined,
        concluida: data.concluida || false,
      };
      setDemandas([nova, ...demandas]);
    }

    setNovaDemanda({ titulo: '', descricao: '', prioridade: 'normal', estimativa: '', sprint: '' });
    setIsDialogOpen(false);
  };

  // Alternar conclusão
  const handleToggleConclusao = async (demanda: Demanda) => {
    const novoStatus = !demanda.concluida;
    const novoStatusDemanda = novoStatus ? 'entregue' : demanda.status;

    if (supabase) {
      await supabase
        .from('pessoal_tarefas')
        .update({ concluida: novoStatus, status: novoStatusDemanda })
        .eq('id', demanda.id);
    }

    setDemandas(demandas.map(d =>
      d.id === demanda.id ? { ...d, concluida: novoStatus, status: novoStatusDemanda } : d
    ));
  };

  // Mover para próximo status
  const handleMoverStatus = async (demanda: Demanda) => {
    const fluxo: Record<string, string> = {
      backlog: 'em_andamento',
      em_andamento: 'validacao',
      validacao: 'entregue',
      entregue: 'backlog',
    };

    const novoStatus = fluxo[demanda.status];
    if (!novoStatus) return;

    if (supabase) {
      await supabase
        .from('pessoal_tarefas')
        .update({ status: novoStatus })
        .eq('id', demanda.id);
    }

    setDemandas(demandas.map(d =>
      d.id === demanda.id ? { ...d, status: novoStatus as Demanda['status'] } : d
    ));
  };

  const getPrioridadeBadge = (prioridade: Demanda['prioridade']) => {
    const p = PRIORIDADES.find(pr => pr.id === prioridade);
    if (!p) return null;
    return (
      <Badge className={`${p.cor} text-white text-[10px]`}>
        {p.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando demandas...</div>;
  }

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Demanda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Demanda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Ex: Implementar dark mode no app"
                  value={novaDemanda.titulo}
                  onChange={(e) => setNovaDemanda({ ...novaDemanda, titulo: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Detalhes da demanda..."
                  value={novaDemanda.descricao}
                  onChange={(e) => setNovaDemanda({ ...novaDemanda, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select
                    value={novaDemanda.prioridade}
                    onValueChange={(v) => setNovaDemanda({ ...novaDemanda, prioridade: v as Demanda['prioridade'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Estimativa</label>
                  <Input
                    placeholder="Ex: 2d, 4h"
                    value={novaDemanda.estimativa}
                    onChange={(e) => setNovaDemanda({ ...novaDemanda, estimativa: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCriarDemanda} className="w-full">
                Criar Demanda
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Botão de Gerar Spec de Design */}
        <Dialog open={isSpecDialogOpen} onOpenChange={setIsSpecDialogOpen}>
          <DialogTrigger>
            <Button size="sm" variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Spec UI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Gerador de Especificação de Design
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Seletor de Engine */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Engine:</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={engineSelecionada === 'gemini' ? 'default' : 'outline'}
                    onClick={() => setEngineSelecionada('gemini')}
                  >
                    ✨ Gemini 2.5 Flash
                  </Button>
                  <Button
                    size="sm"
                    variant={engineSelecionada === 'claude' ? 'default' : 'outline'}
                    onClick={() => setEngineSelecionada('claude')}
                  >
                    🤖 Claude 3.5 Sonnet
                  </Button>
                </div>
              </div>

              {/* Campo de Briefing */}
              <div>
                <label className="text-sm font-medium">Briefing de Design</label>
                <Textarea
                  placeholder="Descreva o que você quer criar: Ex: Um card de métricas com layout horizontal, badge verde para status online, gráficos de linha para..."
                  value={promptBriefing}
                  onChange={(e) => setPromptBriefing(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="text-sm font-medium">Imagem de Referência (opcional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="acto-image-upload"
                  />
                  <label htmlFor="acto-image-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Upload Print
                    </Button>
                  </label>
                  {imagemSelecionada && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={imagemSelecionada} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImagemSelecionada(null)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Gerar */}
              <Button
                onClick={gerarSpec}
                disabled={!promptBriefing || gerandoSpec}
                className="w-full gap-2"
              >
                {gerandoSpec ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando especificação...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Especificação
                  </>
                )}
              </Button>

              {/* Resultado */}
              {specGerada && (
                <div className="space-y-3 pt-4 border-t">
                  {specGerada.especificacao_markdown && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Especificação</span>
                        <Button size="sm" variant="ghost" onClick={() => copiarTexto(specGerada.especificacao_markdown!)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-xs max-h-40 overflow-y-auto">
                        {specGerada.especificacao_markdown.slice(0, 1000)}...
                      </div>
                    </div>
                  )}

                  {specGerada.codigo_tailwind && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Code className="h-3 w-3" /> Tailwind
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => copiarTexto(specGerada.codigo_tailwind!)}>
                          <Copy className="h-3 w-3" /> Copiar
                        </Button>
                      </div>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-40">
                        {specGerada.codigo_tailwind.slice(0, 500)}...
                      </pre>
                    </div>
                  )}

                  {specGerada.prompt_google_stitch && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Prompt Google Stitch</span>
                        <Button size="sm" variant="ghost" onClick={() => copiarTexto(specGerada.prompt_google_stitch!)}>
                          <Copy className="h-3 w-3" /> Copiar
                        </Button>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-xs">
                        {specGerada.prompt_google_stitch.slice(0, 300)}...
                      </div>
                    </div>
                  )}

                  {specGerada.prompt_figma && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          🎨 Prompt Figma
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => copiarTexto(specGerada.prompt_figma!)}>
                          <Copy className="h-3 w-3" /> Copiar
                        </Button>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg text-xs">
                        {specGerada.prompt_figma.slice(0, 300)}...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Projeto */}
      <div className="grid grid-cols-3 gap-3">
        {PROJETOS.map(projeto => (
          <Card
            key={projeto.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              projetoSelecionado === projeto.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setProjetoSelecionado(projeto.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${projeto.corBg} flex items-center justify-center ${projeto.cor}`}>
                {projeto.icone}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{projeto.nome}</h3>
                <p className="text-xs text-muted-foreground">
                  {contagemPorProjeto[projeto.id]} pendentes
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban de Demandas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_DEMANDA.map(status => (
          <div key={status.id} className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <span className={`h-3 w-3 rounded-full ${status.cor}`} />
              <span className="font-medium text-sm">{status.label}</span>
              <Badge variant="secondary" className="ml-auto">
                {demandasPorStatus[status.id].length}
              </Badge>
            </div>

            <div className="space-y-2 min-h-[150px]">
              {demandasPorStatus[status.id].map(demanda => (
                <Card key={demanda.id} className="cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleConclusao(demanda);
                        }}
                        className="mt-0.5"
                      >
                        {demanda.concluida ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm line-clamp-2 ${demanda.concluida ? 'line-through text-muted-foreground' : ''}`}>
                          {demanda.titulo}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getPrioridadeBadge(demanda.prioridade)}
                          {demanda.estimativa && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              {demanda.estimativa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {demanda.status !== 'entregue' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => handleMoverStatus(demanda)}
                      >
                        Mover →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}

              {demandasPorStatus[status.id].length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs border-2 border-dashed rounded-lg">
                  Nenhuma demanda
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
