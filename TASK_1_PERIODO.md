# 🎯 TAREFA 1: Seletor Dinâmico de Mês/Ano & Filtro Temporal no Dashboard

> **Instruções para o Claude:** Leia atentamente esta especificação técnica e implemente a Fase 1 completa no projeto Kora.

---

## 📌 Objetivo
Adicionar navegação temporal completa no Dashboard do Kora, permitindo ao usuário navegar entre meses anteriores, mês atual e meses futuros (`< Setembro 2026 >`), com recálculo instantâneo de todos os KPIs, gráficos de fluxo, categorias e extrato.

---

## 🛠️ O que deve ser implementado

### 1. Novo Componente: `src/components/dashboard/month-selector.tsx`
- **Visual:**
  - Botão de seta para a esquerda (`<` - Mês anterior).
  - Texto central elegante com o mês e ano por extenso em português (ex: **"Setembro de 2026"**).
  - Botão de seta para a direita (`>` - Próximo mês).
  - Botão ou badge "Mês Atual" que surge quando o usuário estiver visualizando um mês diferente do atual, permitindo voltar com 1 clique.
  - Dropdown ou modal compacto opcional para pular direto para qualquer mês/ano.
- **Props:**
  ```typescript
  interface MonthSelectorProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
  }
  ```

---

### 2. Integração no `src/components/dashboard/dashboard-view.tsx`
- Criar o estado:
  ```typescript
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  ```
- Posicionar o `MonthSelector` no topo do Dashboard (dentro do `Header` ou logo abaixo da `VoiceCommandBar`).
- **Filtrar as transações exibidas:**
  - Criar um `useMemo` para `transacoesDoMes`:
    ```typescript
    const transacoesDoMes = useMemo(() => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth(); // 0 a 11
      return transacoes.filter((t) => {
        const parts = t.data_transacao.split('T')[0].split('-');
        const tYear = parseInt(parts[0], 10);
        const tMonth = parseInt(parts[1], 10) - 1;
        return tYear === year && tMonth === month;
      });
    }, [transacoes, selectedDate]);
    ```
- **Atualizar os componentes dependentes para usar `transacoesDoMes`:**
  - `SummaryCards`: passa o resumo calculado sobre `transacoesDoMes`.
  - `CashFlowChart`: exibe o fluxo dos dias pertencentes ao mês selecionado.
  - `CategoryBreakdown`: exibe a distribuição de gastos do mês selecionado.
  - `TransactionTable`: exibe as transações filtradas do mês selecionado (com opção no cabeçalho indicando o mês ativo).

---

### 3. Melhorias no Modal de Nova Transação (`transaction-modal.tsx`)
- Quando o usuário abrir o modal de nova transação enquanto visualiza um mês passado/futuro, a data padrão do formulário pode sugerir a data do mês selecionado (ou o dia de hoje, se for o mês corrente).

---

## ✅ Critérios de Aceite
1. O usuário vê o mês atual selecionado por padrão ao abrir o app.
2. Ao clicar na seta `<` ou `>`, o mês muda (ex: de Setembro para Agosto) e todos os valores (Entradas, Saídas, Saldo, Gráficos e Tabela) recalculam instantaneamente.
3. Se estiver em outro mês e clicar no botão "Mês Atual", o dashboard retorna para a data de hoje.
4. O build (`npm run build`) continua executando com **0 erros** de TypeScript e compilação.
