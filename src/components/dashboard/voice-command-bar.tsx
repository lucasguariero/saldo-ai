'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Loader2, CheckCircle2, AlertCircle, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Transacao } from '@/types/finance';
import { formatCurrency, getTipoConfig } from '@/lib/formatters';

interface VoiceCommandBarProps {
  onTransactionAdded: (transacoes: Transacao[]) => void;
}

export function VoiceCommandBar({ onTransactionAdded }: VoiceCommandBarProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<'idle' | 'recording' | 'transcribing' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastProcessed, setLastProcessed] = useState<{ rawText: string; transacoes: any[] } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer da gravação
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Iniciar gravação de voz
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Suporte para múltiplos formatos de áudio nos navegadores (iOS/Android/Chrome/Safari)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Para todos os tracks do microfone
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob, mimeType);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setStatus('recording');
      setStatusMessage('Ouvindo... Fale sua despesa ou receita');
    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setStatus('error');
      setStatusMessage('Permissão de microfone negada ou não disponível.');
    }
  };

  // Parar gravação e processar
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cancelar gravação
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus('idle');
      setStatusMessage('');
    }
  };

  // Enviar áudio para o backend
  const processAudio = async (audioBlob: Blob, mimeType: string) => {
    try {
      setStatus('transcribing');
      setStatusMessage('Transcrevendo áudio com Whisper...');

      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const audioFile = new File([audioBlob], `voice-input.${extension}`, { type: mimeType });

      const formData = new FormData();
      formData.append('audio', audioFile);

      setStatus('processing');
      setStatusMessage('IA calculando e estruturando transação...');

      const response = await fetch('/api/ai/process-transaction', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar áudio.');
      }

      handleSuccess(data);
    } catch (err: any) {
      console.error('Erro ao processar áudio:', err);
      setStatus('error');
      setStatusMessage(err.message || 'Erro ao processar o áudio.');
    }
  };

  // Enviar texto digitado para o backend
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || status === 'processing' || isRecording) return;

    try {
      const text = inputText.trim();
      setInputText('');
      setStatus('processing');
      setStatusMessage('IA processando texto e calculando...');

      const response = await fetch('/api/ai/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar texto.');
      }

      handleSuccess(data);
    } catch (err: any) {
      console.error('Erro ao processar texto:', err);
      setStatus('error');
      setStatusMessage(err.message || 'Erro ao processar a mensagem.');
    }
  };

  const handleSuccess = (data: { rawText: string; transacoes: any[] }) => {
    setStatus('success');
    setStatusMessage('Transação registrada com sucesso!');
    setLastProcessed(data);
    onTransactionAdded(data.transacoes);

    setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
    }, 6000);
  };

  return (
    <div className="space-y-3">
      {/* Barra Principal de Input / Microfone */}
      <Card className="p-2 sm:p-2.5 shadow-md border-emerald-500/20 bg-card/90 backdrop-blur-md relative overflow-hidden">
        {/* Barra de progresso visual sutil quando processando */}
        {(status === 'transcribing' || status === 'processing') && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-pulse" />
        )}

        {isRecording ? (
          /* Modo Gravando Áudio */
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-3.5 w-3.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-rose-500">
                  Gravando áudio ({formatTimer(recordingTime)})
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  &bull; Fale sua despesa ou receita com naturalidade
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
              >
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={stopRecording}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs h-8 px-3 gap-1.5 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" /> Concluir e Enviar
              </Button>
            </div>
          </div>
        ) : (
          /* Modo Normal: Campo de Texto + Botão de Microfone */
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Sparkles className="absolute left-3 h-4 w-4 text-emerald-500 shrink-0 pointer-events-none" />
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Fale no microfone ou digite: 'Bk 47,30 sendo que 19 o Kajan passou'..."
                className="pl-9 pr-3 h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs sm:text-sm placeholder:text-muted-foreground/70"
                disabled={status === 'transcribing' || status === 'processing'}
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Botão de Microfone */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={startRecording}
                disabled={status === 'transcribing' || status === 'processing'}
                className="h-9 w-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs transition-all hover:scale-105"
                title="Gravar áudio"
              >
                <Mic className="h-4 w-4" />
              </Button>

              {/* Botão de Enviar Texto */}
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim() || status === 'transcribing' || status === 'processing'}
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all"
                title="Processar com IA"
              >
                {status === 'processing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Indicador de Status e Alertas */}
      {statusMessage && (
        <div className="flex items-center gap-2 text-xs px-2 animate-in fade-in slide-in-from-top-1">
          {status === 'transcribing' || status === 'processing' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
              <span className="text-muted-foreground font-medium">{statusMessage}</span>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{statusMessage}</span>
            </>
          ) : status === 'error' ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-rose-500 font-medium">{statusMessage}</span>
            </>
          ) : null}
        </div>
      )}

      {/* Feedback Card da Última Transação Processada */}
      {lastProcessed && status === 'success' && lastProcessed.transacoes.length > 0 && (
        <Card className="p-3 bg-emerald-500/5 border-emerald-500/20 rounded-xl animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Lançamento Registrado pela IA:
              </span>
              <div className="space-y-1">
                {lastProcessed.transacoes.map((t, idx) => {
                  const tipoConfig = getTipoConfig(t.tipo);
                  return (
                    <div key={idx} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-foreground">{t.descricao}</span>
                      <span className={`font-extrabold ${tipoConfig.textColor}`}>
                        {tipoConfig.prefix} {formatCurrency(t.valor)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium">
                        {t.categoria}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium">
                        {t.forma_pagamento}
                      </span>
                      {t.observacao && (
                        <span className="text-muted-foreground text-[11px] italic">
                          ({t.observacao})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setLastProcessed(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
