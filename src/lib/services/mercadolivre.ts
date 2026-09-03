// Serviço de benchmark de preços via API pública do Mercado Livre

export interface ConcorrenteML {
  titulo: string;
  preco: number;
  permalink: string;
  thumbnail: string;
}

export interface BenchmarkResultado {
  menorPreco: number;
  mediana: number;
  maiorPreco: number;
  amostraAnuncios: ConcorrenteML[];
  fotosOficiais: string[];
}

export async function buscarConcorrentesML(
  query: string,
  condicao: 'used' | 'new' = 'used'
): Promise<BenchmarkResultado | null> {
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&condition=${condicao}&limit=15`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GStore-AI/1.0 (Compatible)'
      },
      next: { revalidate: 3600 } // Cache por 1 hora
    });

    if (!res.ok) {
      console.error('ML API error:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const precos = data.results
      .map((item: any) => item.price)
      .filter((p: number) => p > 0);

    precos.sort((a: number, b: number) => a - b);

    const mediana = precos[Math.floor(precos.length / 2)];
    const menorPreco = precos[0];
    const maiorPreco = precos[precos.length - 1];

    const amostraAnuncios: ConcorrenteML[] = data.results.slice(0, 5).map((item: any) => ({
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
  } catch (error) {
    console.error('Erro ao buscar concorrentes ML:', error);
    return null;
  }
}

// Calcular preços de venda baseados no benchmark
export function calcularPrecos(custo: number, benchmark: BenchmarkResultado) {
  const MARGEM_GIRO_RAPIDO = 0.25; // 25% margem mínima
  const MARGEM_MERCADO = 0.35;     // 35% margem padrão
  const MARGEM_MAXIMA = 0.50;       // 50% margem máxima

  return {
    precoPisoGiroRapido: custo * (1 + MARGEM_GIRO_RAPIDO),
    precoMedianaMercado: benchmark.mediana * 0.85, // 15% abaixo da mediana
    precoTetoMercado: benchmark.menorPreco * 0.95, // 5% abaixo do menor preço
    precoMercado: benchmark.mediana,
  };
}
