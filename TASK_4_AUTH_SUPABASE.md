# 🎯 TAREFA 4: Autenticação de Usuário (Supabase Auth) & Proteção de Dados

> **Instruções para o Claude:** Leia atentamente esta especificação técnica para implementar a Fase 4 no projeto Kora.

---

## 📌 Objetivo
Adicionar sistema de login e cadastro seguro via Supabase Auth para proteger os dados financeiros do usuário, associando cada transação ao `user_id` do usuário autenticado e permitindo o deploy público na Vercel com total privacidade.

---

## 🛠️ O que deve ser implementado

### 1. Migração no Banco de Dados Supabase:
- Adicionar coluna `user_id` na tabela `transacoes`:
  ```sql
  ALTER TABLE public.transacoes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ```
- Atualizar as Políticas RLS (Row Level Security) para que cada usuário veja e modifique apenas as suas próprias transações:
  ```sql
  CREATE POLICY "Usuários podem ver apenas suas transacoes" 
  ON public.transacoes FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
  ```

### 2. Páginas de Autenticação no Next.js:
- `src/app/login/page.tsx` — Login com E-mail e Senha (ou Magic Link / Google OAuth).
- `src/app/signup/page.tsx` — Cadastro rápido.
- Componente de Logout / Perfil no `Header`.

### 3. Middleware de Proteção de Rotas:
- Criar `src/middleware.ts` com `@supabase/ssr` para verificar a sessão do usuário e redirecionar usuários não autenticados para `/login`.

### 4. Ajustar Inserções do Voice AI:
- Na rota `/api/ai/process-transaction/route.ts`, capturar o `user.id` da sessão autenticada antes de inserir as transações no banco.

---

## ✅ Critérios de Aceite
1. Usuário não autenticado é redirecionado para `/login`.
2. Após fazer login, o usuário acessa o Dashboard com suas transações privadas.
3. Transações criadas por voz/texto são vinculadas automaticamente ao `user_id` do usuário logado.
