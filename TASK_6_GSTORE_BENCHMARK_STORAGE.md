# 🛍️ TAREFA 6: MOTOR DA G-STORE (BENCHMARK REAL + FOTOS NO SUPABASE STORAGE)

> **Objetivo:** Implementar o motor de inteligência da G-Store separando **Revenda de Estoque Físico (Flip)** de **Vitrine de Afiliados**, integrando consulta real à API do Mercado Livre para benchmark de preços e galeria híbrida de fotos no Supabase Storage.  
> **Dependências:** `TASK_5_MOBILE_SHELL_BOTTOM_NAV.md`

---

## 🎯 Especificação do que fazer:

### 1. Migração do Banco & Tipagem (Modelo Dual da G-Store)
No Supabase / arquivo `src/types/crm.ts`:
- Adicionar o discriminador `tipo_operacao`: `'REVENDA_ESTOQUE' | 'AFILIADO'`.
- Separar arrays de fotos:
  - `fotos_referencia`: URLs de fotos de catálogo salvas no Storage.
  - `fotos_reais`: URLs de fotos tiradas pelo celular salvas no Storage.
  - `foto_capa`: Imagem de destaque para os cards.
- Campos de benchmark:
  - `preco_piso_giro_rapido`, `preco_teto_mercado`, `preco_anunciado`, `preco_venda_final`.
  - `benchmark_concorrentes`: JSONB com os 5 melhores anúncios concorrentes encontrados (título, preço, link, vendedor).

### 2. Serviço de Benchmark de Mercado (`src/lib/services/mercadolivre.ts`)
Criar serviço que consulta a API pública do Mercado Livre:
```typescript
export async function buscarConcorrentesML(query: string, condicao: 'used' | 'new' = 'used') {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&condition=${condicao}&limit=15`;
  const res = await fetch(url, { headers: { 'User-Agent': 'GStore-AI/1.0' } });
  const data = await res.json();

  if (!data.results || data.results.length === 0) return null;

  const precos = data.results.map((item: any) => item.price).filter((p: number) => p > 0);
  precos.sort((a: number, b: number) => a - b);

  const mediana = precos[Math.floor(precos.length / 2)];
  const menorPreco = precos[0];
  const maiorPreco = precos[precos.length - 1];

  const amostraAnuncios = data.results.slice(0, 5).map((item: any) => ({
    titulo: item.title,
    preco: item.price,
    permalink: item.permalink,
    thumbnail: item.thumbnail,
  }));

  const fotosOficiais = data.results
    .slice(0, 3)
    .map((item: any) => item.thumbnail?.replace('-I.jpg', '-O.jpg') || item.thumbnail)
    .filter(Boolean);

  return {
    menorPreco,
    mediana,
    maiorPreco,
    amostraAnuncios,
    fotosOficiais,
  };
}
```

### 3. Pipeline de Fotos no Supabase Storage (`src/lib/services/storage.ts`)
- Configurar/verificar bucket `gstore-produtos` no Supabase Storage.
- Criar helper para baixar fotos oficiais e salvá-las no Storage:
  - `downloadAndStoreImage(imageUrl: string, path: string): Promise<string>`
- Criar endpoint `/api/gstore/upload-photo` para receber uploads diretos do iPhone e gravar no bucket.

### 4. UI da G-Store (`src/components/gstore/gstore-view.tsx`)
- **Seletor de Modo no Topo:** `📦 Estoque / Revenda` | `⭐ Vitrine de Afiliados`.
- **Card do Produto de Revenda:**
  - Carrossel com fotos oficiais de referência e fotos reais.
  - Indicador de Benchmark:
    - *Piso (Giro Rápido):* R$ X (Margem ~25%)
    - *Mediana de Mercado:* R$ Y (Margem ~35%)
    - *Teto:* R$ Z (Margem ~50%)
  - Botão **"📸 Tirar Foto Real"** (input nativo com `capture="environment"` para abrir a câmera no iPhone).
  - Botão **"📋 Copiar Anúncio Pronto"** com feedback visual ("Copiado!").
- **Aba de Afiliados:**
  - Vitrine minimalista de produtos recomendados com botão de editar link de afiliado e loja parceira.

---

## 🧪 Validação e Critérios de Aceite:
1. Ao cadastrar um item de revenda via áudio ou texto, a API do Mercado Livre deve ser consultada e os dados reais de concorrentes salvos em `benchmark_concorrentes`.
2. O botão de upload de fotos deve permitir selecionar arquivos ou abrir a câmera no iOS.
3. `npm run build` deve compilar com 0 erros.

---

## 💻 Comando de Commit:
```bash
git add .
git commit -m "feat(gstore): real mercado livre benchmark API, storage photos and affiliate dual model"
git push origin main
```
