import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BriefingItem {
  tipo: 'finance' | 'gstore' | 'pwlabs' | 'acto';
  titulo: string;
  descricao: string;
  urgencia: 'alta' | 'media' | 'baixa';
}

interface DailyBriefing {
  data: string;
  resumo: string;
  itens: BriefingItem[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      );
    }

    // Obter usuário autenticado (cookies ou Bearer token)
    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        user = data.user;
      }
    }

    if (!user) {
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const hoje = new Date();
    const tresDiasAtras = new Date(hoje);
    tresDiasAtras.setDate(hoje.getDate() - 3);

    const hojeStr = hoje.toISOString().split('T')[0];
    const tresDiasStr = tresDiasAtras.toISOString().split('T')[0];

    const itens: BriefingItem[] = [];

    // 1. Pessoal - Finanças: contas vencendo hoje/esta semana
    const { data: transacoesPendentes } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', user.id)
      .eq('tipo', 'SAIDA_PENDENTE')
      .lte('data_vencimento', hojeStr);

    if (transacoesPendentes && transacoesPendentes.length > 0) {
      const totalPendentes = transacoesPendentes.reduce((sum, t) => sum + Number(t.valor), 0);
      itens.push({
        tipo: 'finance',
        titulo: `${transacoesPendentes.length} conta(s) pendente(s)`,
        descricao: `Total de R$ ${totalPendentes.toFixed(2)} aguardando pagamento`,
        urgencia: 'alta',
      });
    }

    // 2. G-Store: itens esperando anúncio há mais de 3 dias
    const { data: produtosPendentes } = await supabase
      .from('produtos_estoque')
      .select('*')
      .eq('user_id', user.id)
      .eq('tipo_operacao', 'REVENDA_ESTOQUE')
      .eq('status', 'PENDENTE_ANUNCIO')
      .lte('created_at', tresDiasStr);

    if (produtosPendentes && produtosPendentes.length > 0) {
      itens.push({
        tipo: 'gstore',
        titulo: `${produtosPendentes.length} item(ns) esperando há mais de 3 dias`,
        descricao: 'Itens comprados para revenda precisam de fotos e anúncio',
        urgencia: 'media',
      });
    }

    // 3. G-Store: itens sem fotos
    const { data: produtosSemFotos } = await supabase
      .from('produtos_estoque')
      .select('id, titulo, fotos_reais')
      .eq('user_id', user.id)
      .eq('tipo_operacao', 'REVENDA_ESTOQUE')
      .eq('status', 'COMPRADO_PREPARACAO');

    const produtosSemFotosReais = produtosSemFotos?.filter(p =>
      !p.fotos_reais || p.fotos_reais.length === 0
    ) || [];

    if (produtosSemFotosReais.length > 0) {
      itens.push({
        tipo: 'gstore',
        titulo: `${produtosSemFotosReais.length} item(ns) sem foto real`,
        descricao: 'Tire fotos dos produtos para criar anúncios',
        urgencia: 'media',
      });
    }

    // 4. PW Labs: propostas pendentes (em estágio de PROPOSTA há mais de 5 dias)
    const cincoDiasAtras = new Date(hoje);
    cincoDiasAtras.setDate(hoje.getDate() - 5);
    const cincoDiasStr = cincoDiasAtras.toISOString().split('T')[0];

    const { data: propostasAntigas } = await supabase
      .from('crm_deals')
      .select('*')
      .eq('user_id', user.id)
      .eq('estagio', 'PROPOSTA')
      .lte('created_at', cincoDiasStr);

    if (propostasAntigas && propostasAntigas.length > 0) {
      const valorPropostas = propostasAntigas.reduce((sum, d) => sum + Number(d.valor_estimado), 0);
      itens.push({
        tipo: 'pwlabs',
        titulo: `${propostasAntigas.length} proposta(s) sem resposta há +5 dias`,
        descricao: `Valor total: R$ ${valorPropostas.toFixed(2)} - Faça follow-up!`,
        urgencia: 'alta',
      });
    }

    // 5. Acto: demandas urgentes
    const { data: demandasUrgentes } = await supabase
      .from('pessoal_tarefas')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', 'acto')
      .eq('prioridade', 'URGENTE')
      .eq('concluida', false);

    if (demandasUrgentes && demandasUrgentes.length > 0) {
      itens.push({
        tipo: 'acto',
        titulo: `${demandasUrgentes.length} demanda(s) urgente(s)`,
        descricao: 'Demandas prioritárias precisando de atenção',
        urgencia: 'alta',
      });
    }

    // Gerar resumo
    const contagens = {
      finance: itens.filter(i => i.tipo === 'finance').length,
      gstore: itens.filter(i => i.tipo === 'gstore').length,
      pwlabs: itens.filter(i => i.tipo === 'pwlabs').length,
      acto: itens.filter(i => i.tipo === 'acto').length,
    };

    const totalItens = itens.length;
    let resumo = '';

    if (totalItens === 0) {
      resumo = 'Tudo em ordem! Nenhuma pendência crítica.';
    } else {
      const partes: string[] = [];
      if (contagens.finance > 0) partes.push(`${contagens.finance} financeira(s)`);
      if (contagens.gstore > 0) partes.push(`${contagens.gstore} na G-Store`);
      if (contagens.pwlabs > 0) partes.push(`${contagens.pwlabs} na PW Labs`);
      if (contagens.acto > 0) partes.push(`${contagens.acto} no Acto`);
      resumo = `Você tem ${totalItens} pendência(s): ${partes.join(', ')}.`;
    }

    const briefing: DailyBriefing = {
      data: hojeStr,
      resumo,
      itens,
    };

    return NextResponse.json(briefing);
  } catch (error) {
    console.error('Daily briefing error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
