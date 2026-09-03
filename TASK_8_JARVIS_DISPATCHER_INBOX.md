# 🧠 TAREFA 8: CÉREBRO CENTRAL JARVIS (DISPATCHER MULTI-WORKSPACE & INBOX DE TRIAGEM)

> **Objetivo:** Refinar o Dispatcher de IA para que o Jarvis compreenda com precisão comandos de voz e texto destinados aos 4 ecossistemas (`G-Store`, `PW Labs`, `Acto`, `Pessoal`), fornecendo feedback de triagem com confirmação em 1 clique e resumo executivo proativo.  
> **Dependências:** `TASK_5`, `TASK_6`, `TASK_7`

---

## 🎯 Especificação do que fazer:

### 1. Refatorar o Dispatcher de IA (`src/lib/ai/extractor.ts`)
Aprimorar o `SYSTEM_PROMPT_DISPATCHER` para reconhecer com clareza as intenções:
1. `GSTORE_REVENDA`:
   - *"Comprei um PS5 por 2.400 pra loja"* $\rightarrow$ Dispara benchmark do Mercado Livre e cadastra no estoque.
2. `GSTORE_AFILIADO`:
   - *"Recomendar suporte de monitor da Elg na vitrine da G-Store"* $\rightarrow$ Cadastra na vitrine de afiliados.
3. `PWLABS_DEAL`:
   - *"Fechei proposta de 4k com a Imobiliária Alfa para landing page"* $\rightarrow$ Cadastra no pipeline da PW Labs.
4. `ACTO_DEMANDA`:
   - *"Adicionar tarefa na Flora: corrigir responsividade do checkout"* $\rightarrow$ Cadastra na sprint do projeto Acto.
5. `PESSOAL_FINANCE`:
   - *"Almocei no restaurante por 35 no débito"* $\rightarrow$ Cadastra no fluxo de caixa pessoal.
6. `PESSOAL_TAREFA`:
   - *"Lembrar de ligar para a contabilidade às 15h"* $\rightarrow$ Cadastra nas tarefas pessoais.

### 2. Componente de Triagem Rápida (`src/components/dashboard/triage-card.tsx`)
- Card flutuante ou inserido no topo logo abaixo da barra de voz que exibe o resultado da interpretação do Jarvis:
  - **Badge do Workspace:** `🛍️ G-Store` | `🏢 PW Labs` | `🎯 Acto` | `👤 Pessoal`
  - **Resumo do Item:** Título gerado, valor/custo e ação planejada.
  - **Ações:**
    - Botão Verde: **"Confirmar"** (ou auto-confirma após 5 segundos se não houver clique).
    - Botão Secundário: **"Mudar Workspace"** (dropdown rápido caso a IA tenha classificado no lugar errado).

### 3. Resumo Executivo Diário (Jarvis Daily Briefing)
Criar endpoint `/api/ai/daily-briefing`:
- Analisa os dados consolidados das 4 frentes:
  - Total em caixa pessoal e contas vencendo hoje/esta semana.
  - Itens na G-Store esperando anúncio ou fotos há mais de 3 dias.
  - Propostas pendentes na PW Labs precisando de follow-up.
  - Demandas prioritárias da Flora / CityPro.
- Exibe um card minimalista no topo: *"Bom dia! Aqui está o seu panorama operacional para hoje."*

---

## 🧪 Validação e Critérios de Aceite:
1. Falar ou digitar frases de cada uma das 4 frentes deve direcionar o item com precisão para o respectivo módulo.
2. O card de triagem deve permitir aprovação ou troca rápida de workspace.
3. `npm run build` deve compilar com 0 erros.

---

## 💻 Comando de Commit:
```bash
git add .
git commit -m "feat(jarvis): intelligent multi-workspace dispatcher, triage inbox and executive briefing"
git push origin main
```
