# 🏢 TAREFA 7: WORKSPACES PW LABS (B2B CRM) E ACTO (PROJETOS & SPRINT TRACKER)

> **Objetivo:** Implementar os módulos de negócio para a **PW Labs** (Agência B2B com funil comercial) e para a **Acto** (Gestão de produto/UX com acompanhamento de sprints da Flora e CityPro).  
> **Dependências:** `TASK_5_MOBILE_SHELL_BOTTOM_NAV.md`

---

## 🎯 Especificação do que fazer:

### 1. Módulo PW Labs (Agência B2B)
Arquivo: `src/components/pwlabs/deals-kanban.tsx`
- **Funil de Vendas Interativo:**
  - 4 colunas principais:
    1. 🎯 **Prospecção** (Novos contatos e oportunidades)
    2. 📑 **Proposta Enviada** (Em negociação / aguardando aceite)
    3. ⚙️ **Produção** (Contrato ganho, landing page / tráfego em execução)
    4. 🤝 **Fechado** (Concluído e faturado)
- **Cards de Deals:**
  - Nome do cliente / empresa.
  - Valor da proposta (R$) com badge visual.
  - Tags de serviços prestados (`Landing Page`, `Tráfego Pago`, `Branding`, `Automação`).
  - Próxima ação recomendada e data de retorno.
  - Ação de mover de estágio com 1 clique (ou arrastar).
- **KPIs do Topo:**
  - Total em Pipeline (R$)
  - Propostas Abertas
  - Faturamento Fechado do Mês
  - Taxa de Conversão estimada

### 2. Módulo Acto (Gestão de Produtos & UX)
Arquivo: `src/components/acto/acto-view.tsx`
- **Seletor de Projeto:**
  - 🌸 **Flora**
  - 🏙️ **CityPro**
  - 🛠️ **Ferramentas Internas**
- **Lista de Demandas (Estilo Linear / Kanban Minimalista):**
  - Colunas/Abas: `Backlog` | `Em Andamento` | `Validação / Review` | `Entregue`.
  - Cada demanda contém:
    - Título da feature / melhoria de UX / correção.
    - Tag de prioridade: `Urgente` (vermelho), `Alta` (laranja), `Normal` (azul).
    - Estimativa de esforço ou sprint alvo.
    - Checkbox de conclusão rápida.
- **Botão de Ação Rápida:** "Adicionar Demanda" com modal limpo.

### 3. Integração com o Banco de Dados (Supabase Realtime)
- Conectar `crm_deals` com listener em tempo real no Supabase.
- Conectar tabela `acto_demandas` (ou `pessoal_tarefas` com filtro por `workspace_id = 'acto'`) para sincronização instantânea.

---

## 🧪 Validação e Critérios de Aceite:
1. Mudar para a aba PW Labs na `BottomNavBar` deve carregar o funil comercial com os cards interativos.
2. Mudar para a aba Acto deve permitir alternar entre Flora e CityPro e adicionar/concluir demandas.
3. `npm run build` deve compilar com 0 erros de TypeScript.

---

## 💻 Comando de Commit:
```bash
git add .
git commit -m "feat: complete PW Labs B2B CRM pipeline and Acto product sprint tracker"
git push origin main
```
