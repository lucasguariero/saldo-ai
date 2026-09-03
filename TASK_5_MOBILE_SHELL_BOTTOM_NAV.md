# 📱 TAREFA 5: REESTRUTURAÇÃO DA CASCA MÓVEL COM BOTTOM NAV BAR

> **Objetivo:** Implementar a barra de navegação inferior fixa (`BottomNavBar`) otimizada para iOS Safari (safe-area), transformando o layout do app em um cockpit multi-workspace ergonômico com 4 abas: **🛍️ G-Store**, **🏢 PW Labs**, **🎯 Acto**, **👤 Pessoal**.  
> **Dependências:** Nenhuma (Primeira fase da expansão Jarvis Multi-Workspace).

---

## 🎯 Especificação do que fazer:

### 1. Criar o Componente `src/components/layout/bottom-nav-bar.tsx`
- Barra inferior fixa (`fixed bottom-0 left-0 right-0 z-50`) com efeito *glassmorphism* (`bg-background/90 backdrop-blur-lg border-t border-border/50`).
- Suporte estrito à safe-area do iPhone (`pb-[env(safe-area-inset-bottom,16px)] pt-2 px-4`).
- 4 botões com ícones da Lucide, rótulo em texto e indicador de estado ativo:
  - **🛍️ G-Store:** Ícone `ShoppingBag` — Rótulo "G-Store"
  - **🏢 PW Labs:** Ícone `Briefcase` — Rótulo "PW Labs"
  - **🎯 Acto:** Ícone `Layers` ou `Kanban` — Rótulo "Acto"
  - **👤 Pessoal:** Ícone `Wallet` ou `User` — Rótulo "Pessoal"
- Animação suave de transição de abas e feedback tátil/visual no toque.

### 2. Atualizar o Gerenciamento de Estado do Workspace Ativo
- Definir o tipo central em `src/types/workspace.ts`:
  ```typescript
  export type WorkspaceId = 'gstore' | 'pwlabs' | 'acto' | 'pessoal';
  ```
- Salvar o workspace ativo no `localStorage` para que ao recarregar o app no iPhone ele se mantenha na última aba acessada.

### 3. Ajustar `src/app/page.tsx` e `src/components/dashboard/dashboard-view.tsx`
- Remover o seletor dropdown antigo do header que ocupava espaço desnecessário.
- Garantir espaçamento inferior no container principal (`pb-24` ou `pb-28`) para que o conteúdo nunca fique escondido atrás da `BottomNavBar`.
- Manter a barra de voz/input do Jarvis (`VoiceCommandBar`) no topo, acessível e visível em todos os workspaces.
- Renderizar dinamicamente a visão correspondente:
  - `gstore` $\rightarrow$ Componente `<GStoreView />`
  - `pwlabs` $\rightarrow$ Componente `<DealsKanban />`
  - `acto` $\rightarrow$ Componente `<ActoView />` (Placeholder elegante com lista de projetos: Flora e CityPro)
  - `pessoal` $\rightarrow$ Painel Financeiro e Tarefas (`Overview`, `Contas a Pagar`, `Extrato`)

---

## 🧪 Validação e Critérios de Aceite:
1. `npm run build` deve compilar com 0 erros de TypeScript.
2. No iPhone (ou responsivo móvel), a barra inferior deve ficar perfeitamente encaixada acima da barra de navegação nativa do iOS.
3. Tocar em cada aba deve alternar a tela instantaneamente sem recarregar a página.

---

## 💻 Comando de Commit:
```bash
git add .
git commit -m "feat: mobile shell with bottom navigation bar for 4 workspaces"
git push origin main
```
