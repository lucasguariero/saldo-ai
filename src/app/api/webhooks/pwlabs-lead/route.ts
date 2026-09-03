import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface LeadPayload {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  mensagem?: string;
  servico_interesse?: string;
}

// Buscar o primeiro usuário admin do sistema
async function getAdminUserId(supabase: any): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single();

  if (error || !data) {
    // Se não encontrar, tenta buscar qualquer usuário
    const { data: users } = await supabase
      .from('user_settings')
      .select('user_id')
      .limit(1)
      .single();

    return users?.user_id || null;
  }

  return data?.id || null;
}

export async function POST(req: NextRequest) {
  try {
    const body: LeadPayload = await req.json();
    const { nome, email, telefone, empresa, mensagem, servico_interesse } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e e-mail são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar cliente Supabase (usar service_role para webhook backend autônomo)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Configuração do Supabase ausente' },
        { status: 500 }
      );
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey || anonKey);

    let userId: string | null = null;

    if (serviceKey) {
      try {
        const { data: userList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (userList?.users?.[0]?.id) {
          userId = userList.users[0].id;
        }
      } catch (e) {
        console.warn('Falha ao listar usuários via admin API:', e);
      }
    }

    if (!userId) {
      const { data: existingDeal } = await supabase.from('crm_deals').select('user_id').limit(1).maybeSingle();
      if (existingDeal?.user_id) userId = existingDeal.user_id;
    }

    if (!userId) {
      const { data: existingTrans } = await supabase.from('transacoes').select('user_id').limit(1).maybeSingle();
      if (existingTrans?.user_id) userId = existingTrans.user_id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuário proprietário encontrado no sistema' },
        { status: 500 }
      );
    }

    // Criar o deal no CRM
    const dealData = {
      user_id: userId,
      workspace_id: 'pwlabs',
      titulo_deal: `${empresa || nome} - Lead do Site`,
      contato_nome: nome,
      contato_telefone: telefone || null,
      contato_email: email,
      empresa: empresa || null,
      valor_estimado: 0,
      estagio: 'PROSPECCAO',
      servicos: servico_interesse ? [servico_interesse] : null,
      notas: mensagem ? `Mensagem recebida via site: ${mensagem}` : (servico_interesse ? `Serviço de interesse: ${servico_interesse}` : null),
    };

    const { data: deal, error: dealError } = await supabase
      .from('crm_deals')
      .insert(dealData)
      .select()
      .single();

    if (dealError) {
      console.error('Erro ao criar deal:', dealError);
      return NextResponse.json(
        { error: 'Erro ao criar lead no CRM' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deal_id: deal.id,
      message: 'Lead criado com sucesso!'
    });
  } catch (error) {
    console.error('Error in pwlabs-lead webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
