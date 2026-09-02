# 🎯 TAREFA 2: Painel de Contas a Pagar & Faturas de Cartão

> **Instruções para o Claude:** Leia atentamente esta especificação técnica para implementar a Fase 2 no projeto Kora.

---

## 📌 Objetivo
Criar uma visão/aba dedicada para a gestão de **Contas a Pagar e Faturas de Cartão** (`SAIDA_PENDENTE`), com contagem regressiva de vencimento, alertas visuais para contas atrasadas ou próximas do vencimento e botão rápido de quitação com escolha da forma de pagamento.

---

## 🛠️ O que deve ser implementado

### 1. Novo Componente: `src/components/dashboard/pending-bills-tab.tsx`
- **Métricas do Painel de Pendências:**
  - Total a pagar no mês selecionado.
  - Total de contas já vencidas (com destaque em vermelho).
  - Total de contas a vencer nos próximos 7 dias (destaque em âmbar).
- **Lista de Contas / Faturas:**
  - Cada item deve exibir:
    - Descrição e Categoria.
    - Valor formatado.
    - Data de Vencimento com Badge de Status:
      - 🔴 **Vencida há X dias** (se a data de vencimento for anterior a hoje).
      - 🟡 **Vence hoje** ou **Vence em X dias** (se faltar até 5 dias).
      - ⚪ **Vence em DD/MM/AAAA** (se estiver dentro do prazo normal).
    - Botão de Ação Rápida: **"Marcar como Pago"** (abre diálogo de confirmação ou baixa imediata).

### 2. Fluxo de Quitação ("Marcar como Pago"):
- Ao clicar em "Marcar como Pago":
  - Abre um mini-modal ou popover permitindo selecionar a `forma_pagamento` utilizada (`PIX`, `DEBITO`, `DINHEIRO`, `CREDITO`) e a `data_pagamento` (padrão: hoje).
  - Atualiza o registro no Supabase: `tipo: 'SAIDA_PAGA'`, `data_transacao: data_pagamento`, `data_vencimento: null`.
  - O saldo em caixa e as métricas de saídas pagas atualizam instantaneamente.

### 3. Integração com Tabs no Dashboard:
- No `DashboardView`, adicionar abas usando o componente `Tabs` do shadcn/ui:
  - **Aba 1: Visão Geral** (Dashboard atual com gráficos e extrato geral).
  - **Aba 2: Contas a Pagar / Faturas** (Painel de pendências com contador de itens pendentes no badge da aba).

---

## ✅ Critérios de Aceite
1. O usuário pode alternar entre "Visão Geral" e "Contas a Pagar".
2. As contas pendentes exibem badges dinâmicos de urgência de vencimento (Vencida, Vence hoje, Vence em X dias).
3. Quitar uma conta converte para `SAIDA_PAGA` no Supabase e atualiza o saldo na hora.
