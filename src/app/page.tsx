import { DashboardView } from '@/components/dashboard/dashboard-view';
import { createClient } from '@/lib/supabase/server';
import { Transacao } from '@/types/finance';

export const revalidate = 0; // Dynamic rendering for fresh financial data

export default async function HomePage() {
  let initialTransacoes: Transacao[] = [];

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data_transacao', { ascending: false });

      if (!error && data) {
        initialTransacoes = data as Transacao[];
      }
    }
  } catch (err) {
    console.warn('Could not SSR fetch from Supabase (using client fallback/mock):', err);
  }

  return <DashboardView initialTransacoes={initialTransacoes} />;
}
