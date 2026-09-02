import { NextRequest, NextResponse } from 'next/server';
import { processAudioFile, extractTransactionsFromText, classifyAndExtract } from '@/lib/ai/extractor';
import { createClient } from '@/lib/supabase/server';
import { NovaTransacaoInput } from '@/types/finance';
import { TipoIntento } from '@/types/crm';

export async function POST(req: NextRequest) {
  try {
    // Obter usuário autenticado
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Serviço de banco de dados não disponível.' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado. Faça login para continuar.' },
        { status: 401 }
      );
    }

    let rawText = '';
    let intentType: TipoIntento = 'PESSOAL_FINANCE';
    let extractedData: any = null;
    const contentType = req.headers.get('content-type') || '';

    // 1. Processar entrada (áudio ou texto)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File | null;
      const textParam = formData.get('text') as string | null;

      if (audioFile && audioFile.size > 0) {
        // Processar áudio - primeiro extrai transações (retrocompatibilidade)
        const audioResult = await processAudioFile(audioFile);
        rawText = audioResult.rawText;

        // Agora classifica o conteúdo
        const classification = await classifyAndExtract(rawText);
        intentType = classification.tipo;
        extractedData = classification.dados;
      } else if (textParam) {
        rawText = textParam;
        const classification = await classifyAndExtract(rawText);
        intentType = classification.tipo;
        extractedData = classification.dados;
      }
    }
    // 2. Processar JSON direto (texto)
    else if (contentType.includes('application/json')) {
      const body = await req.json();
      rawText = body.text || '';
      if (rawText.trim()) {
        const classification = await classifyAndExtract(rawText);
        intentType = classification.tipo;
        extractedData = classification.dados;
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nenhum áudio ou texto válido foi fornecido.' },
        { status: 400 }
      );
    }

    // 3. Salvar na tabela correta conforme o tipo de intenção
    const hoje = new Date().toISOString().split('T')[0];
    let insertedRecord: any = null;
    let message = '';

    try {
      if (intentType === 'GSTORE_PRODUTO' && extractedData?.produto) {
        // Salvar na tabela produtos_estoque
        const produto = {
          ...extractedData.produto,
          user_id: user.id,
          workspace_id: 'gstore',
          status: extractedData.produto.status || 'COMPRADO_PREPARACAO',
        };

        const { data, error } = await supabase
          .from('produtos_estoque')
          .insert(produto as any)
          .select()
          .single();

        if (error) throw error;
        insertedRecord = data;
        message = 'Produto cadastrado no estoque da G-Store!';
      } else if (intentType === 'PWLABS_DEAL' && extractedData?.deal) {
        // Salvar na tabela crm_deals
        const deal = {
          ...extractedData.deal,
          user_id: user.id,
          workspace_id: 'pwlabs',
          estagio: extractedData.deal.estagio || 'PROSPECCAO',
        };

        const { data, error } = await supabase
          .from('crm_deals')
          .insert(deal as any)
          .select()
          .single();

        if (error) throw error;
        insertedRecord = data;
        message = 'Deal cadastrado no pipeline PW Labs!';
      } else if (intentType === 'PESSOAL_TAREFA' && extractedData?.tarefa) {
        // Salvar na tabela pessoal_tarefas
        const tarefa = {
          titulo: extractedData.tarefa.titulo,
          descricao: extractedData.tarefa.descricao || null,
          concluida: false,
          prioridade: extractedData.tarefa.prioridade || 'MEDIA',
          data_limite: extractedData.tarefa.data_limite || null,
          horario: extractedData.tarefa.horario || null,
          user_id: user.id,
          workspace_id: 'pessoal',
        };

        const { data, error } = await supabase
          .from('pessoal_tarefas')
          .insert(tarefa as any)
          .select()
          .single();

        if (error) throw error;
        insertedRecord = data;
        message = 'Tarefa adicionada à sua lista!';
      } else {
        // PESSOAL_FINANCE - Salvar na tabela transacoes (retrocompatibilidade)
        const transacao = extractedData?.transacao || {
          descricao: rawText,
          valor: 0,
          tipo: 'SAIDA_PAGA',
          categoria: 'Outros',
          forma_pagamento: 'PIX',
        };

        const transacaoComUserId = {
          ...transacao,
          user_id: user.id,
          workspace_id: 'pessoal',
          data_transacao: hoje,
        };

        const { data, error } = await supabase
          .from('transacoes')
          .insert(transacaoComUserId as any)
          .select()
          .single();

        if (error) throw error;
        insertedRecord = data;
        message = 'Transação financeira registrada!';
      }
    } catch (dbErr: any) {
      console.error('Erro ao salvar no Supabase:', dbErr);
      // Em caso de erro no banco, retorna os dados processados mesmo assim
      message = 'Processado pela IA, mas erro ao salvar no banco.';
    }

    return NextResponse.json({
      success: true,
      rawText,
      intentType,
      data: insertedRecord,
      message,
    });
  } catch (error: any) {
    console.error('Erro em process-transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Ocorreu um erro ao processar.',
      },
      { status: 500 }
    );
  }
}
