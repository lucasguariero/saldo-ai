# 🎯 TAREFA 3: Configuração PWA Completa & Otimização Mobile

> **Instruções para o Claude:** Leia atentamente esta especificação técnica para implementar a Fase 3 no projeto Kora.

---

## 📌 Objetivo
Transformar o Kora em um **Progressive Web App (PWA)** instalável no iOS (Safari) e Android (Chrome) com comportamento de app nativo (tela cheia sem barra de endereço, ícone customizado, cores de status bar e suporte offline básico).

---

## 🛠️ O que deve ser implementado

### 1. Arquivo de Manifesto: `public/manifest.json`
- Configurar:
  ```json
  {
    "name": "Kora — Gestão Financeira com IA",
    "short_name": "Kora",
    "description": "Controle financeiro pessoal com gravação de voz e IA",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#09090b",
    "theme_color": "#09090b",
    "icons": [
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  }
  ```

### 2. Meta Tags no `src/app/layout.tsx`:
- Adicionar metadados para iOS/PWA:
  - `apple-mobile-web-app-capable`: `yes`
  - `apple-mobile-web-app-status-bar-style`: `black-translucent`
  - `apple-mobile-web-app-title`: `Kora`
  - `viewport`: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no` (evita zoom acidental ao clicar nos inputs no celular).

### 3. Ícones em SVG/PNG (`public/icons/`):
- Gerar ícones elegantes com o logo/gradiente do Kora (verde esmeralda / roxo escuro).

### 4. Otimização de Layout para Celular:
- Garantir que a barra de microfone fique fixa/visível na parte inferior ou superior no mobile.
- Padding seguro (`safe-area-inset-bottom`) para iPhone sem barra preta cobrindo os botões.

---

## ✅ Critérios de Aceite
1. Abrir no navegador do celular exibe a opção de "Adicionar à Tela de Início".
2. Ao abrir pelo ícone instalado, o Kora abre em tela cheia (standalone), sem barra de navegação do browser.
