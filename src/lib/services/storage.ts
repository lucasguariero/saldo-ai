// Serviço de storage para fotos da G-Store

import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'gstore-produtos';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload de foto direta do iPhone para o Supabase Storage
 */
export async function uploadPhoto(
  file: File,
  userId: string,
  produtoId: string,
  tipo: 'referencia' | 'real' = 'real'
): Promise<UploadResult> {
  const supabase = createClient();

  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${produtoId}/${tipo}_${timestamp}.${extension}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Download e armazenamento de foto de URL externa
 */
export async function downloadAndStoreImage(
  imageUrl: string,
  userId: string,
  produtoId: string,
  tipo: 'referencia' | 'real' = 'referencia'
): Promise<UploadResult> {
  try {
    // Baixar imagem
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { success: false, error: 'Falha ao baixar imagem' };
    }

    const blob = await response.blob();
    const file = new File([blob], `${tipo}_${Date.now()}.jpg`, {
      type: blob.type || 'image/jpeg',
    });

    return uploadPhoto(file, userId, produtoId, tipo);
  } catch (error) {
    console.error('Download image error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Deletar foto do storage
 */
export async function deletePhoto(path: string): Promise<boolean> {
  const supabase = createClient();

  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Listar fotos de um produto
 */
export async function listPhotos(
  userId: string,
  produtoId: string
): Promise<string[]> {
  const supabase = createClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/${produtoId}/`, {
        limit: 50,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error || !data) {
      return [];
    }

    // Gerar URLs públicas
    const urls = data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${userId}/${produtoId}/${file.name}`);
      return urlData.publicUrl;
    });

    return urls;
  } catch (error) {
    console.error('List photos error:', error);
    return [];
  }
}
