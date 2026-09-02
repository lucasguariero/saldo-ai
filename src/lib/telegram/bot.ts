const TELEGRAM_API_URL = 'https://api.telegram.org';

interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

/**
 * Baixa um arquivo do Telegram pelo file_id
 */
export async function downloadTelegramFile(
  fileId: string,
  botToken: string
): Promise<Buffer> {
  // Primeiro, pega o caminho do arquivo
  const fileResponse = await fetch(
    `${TELEGRAM_API_URL}/bot${botToken}/getFile?file_id=${fileId}`
  );

  if (!fileResponse.ok) {
    throw new Error(`Failed to get file info: ${fileResponse.statusText}`);
  }

  const fileData: TelegramResponse<TelegramFile> = await fileResponse.json();

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error(`Telegram API error: ${fileData.description}`);
  }

  // Agora baixa o arquivo
  const fileUrl = `${TELEGRAM_API_URL}/file/bot${botToken}/${fileData.result.file_path}`;
  const fileResponseBuffer = await fetch(fileUrl);

  if (!fileResponseBuffer.ok) {
    throw new Error(`Failed to download file: ${fileResponseBuffer.statusText}`);
  }

  const arrayBuffer = await fileResponseBuffer.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Envia uma mensagem para o Telegram
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  botToken: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<void> {
  const response = await fetch(
    `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Telegram sendMessage error:', error);
    throw new Error(`Failed to send message: ${response.statusText}`);
  }
}

/**
 * Envia mensagem formatada com os dados da transação
 */
export async function sendTransactionConfirmation(
  chatId: number | string,
  transacao: {
    descricao: string;
    valor: number;
    tipo: 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';
    categoria: string;
    forma_pagamento: string;
    observacao?: string | null;
  },
  botToken: string
): Promise<void> {
  const emojiTipo = {
    ENTRADA: '💰',
    SAIDA_PAGA: '💸',
    SAIDA_PENDENTE: '⏳',
  };

  const emojiForma = {
    PIX: '📱',
    DEBITO: '💳',
    CREDITO: '💳',
    DINHEIRO: '💵',
  };

  const tipoLabel = {
    ENTRADA: 'Entrada',
    SAIDA_PAGA: 'Saída Paga',
    SAIDA_PENDENTE: 'Saída Pendente',
  };

  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(transacao.valor);

  const text = `
${emojiTipo[transacao.tipo]} *${tipoLabel[transacao.tipo]}*

*Descrição:* ${transacao.descricao}
*Valor:* ${valorFormatado}
*Categoria:* ${transacao.categoria}
*Forma:* ${emojiForma[transacao.forma_pagamento as keyof typeof emojiForma]} ${transacao.forma_pagamento}
${transacao.observacao ? `*Obs:* ${transacao.observacao}` : ''}

✅ *Registrado com sucesso!*
  `.trim();

  await sendTelegramMessage(chatId, text, botToken, 'Markdown');
}

/**
 * Envia mensagem de erro amigável
 */
export async function sendErrorMessage(
  chatId: number | string,
  botToken: string
): Promise<void> {
  const text = `
⚠️ *Ops! Não consegui identificar a transação.*

Tente informar assim:
• *Entrada:* "recebi 1500 de salário" ou "vendi 2 whey por 178 no pix"
• *Saída:* "almço 32,50 no débito" ou "Bk 47,30 sendo que 19 o Kajan passou"

Ou mande um áudio descrevendo a transação! 🎤
  `.trim();

  await sendTelegramMessage(chatId, text, botToken, 'Markdown');
}
