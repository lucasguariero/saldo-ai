import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const produtoId = formData.get('produtoId') as string | null;
    const tipo = formData.get('tipo') as 'referencia' | 'real' | null;

    if (!file || !userId || !produtoId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: file, userId, produtoId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${produtoId}/${tipo || 'real'}_${timestamp}.${extension}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Fazer upload para o bucket gstore-produtos
    const { data, error } = await supabase.storage
      .from('gstore-produtos')
      .upload(path, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gstore-produtos')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('Upload exception:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
