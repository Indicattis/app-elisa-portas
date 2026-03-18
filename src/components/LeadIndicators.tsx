import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, Users, Trophy } from "lucide-react";
interface VendaData {
  valor_venda: number;
  data_venda: string;
  atendente_id: string;
}
interface AtendenteVenda {
  nome: string;
  total: number;
  quantidade: number;
}
export function LeadIndicators() {
  const [totalNegociacoes, setTotalNegociacoes] = useState<number>(0);
  const [totalVendas, setTotalVendas] = useState<number>(0);
  const [vendasMes, setVendasMes] = useState<number>(0);
  const [placarAtendentes, setPlacarAtendentes] = useState<AtendenteVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    isAdmin
  } = useAuth();
  useEffect(() => {
    fetchIndicadores();
  }, []);
  const fetchIndicadores = async () => {
    try {
      // Buscar total de negociações (valor_orcamento de todos os leads)
      const {
        data: leadsData,
        error: leadsError
      } = await supabase.from("elisaportas_leads").select("valor_orcamento").not("valor_orcamento", "is", null);
      if (leadsError) throw leadsError;
      const totalNegs = leadsData?.reduce((acc, lead) => acc + (lead.valor_orcamento || 0), 0) || 0;
      setTotalNegociacoes(totalNegs);

      // Buscar vendas
      const {
        data: vendasData,
        error: vendasError
      } = await supabase.from("vendas").select("valor_venda, data_venda, atendente_id");
      if (vendasError) throw vendasError;
      if (vendasData) {
        const totalVendasValue = vendasData.reduce((acc, venda) => acc + venda.valor_venda, 0);
        setTotalVendas(totalVendasValue);

        // Vendas do mês atual
        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        const vendasDoMes = vendasData.filter(venda => {
          const dataVenda = new Date(venda.data_venda);
          return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
        });
        setVendasMes(vendasDoMes.length);

        // Buscar nomes dos atendentes
        const atendenteIds = [...new Set(vendasData.map(venda => venda.atendente_id))];
        const {
          data: atendentesData
        } = await supabase.from("admin_users").select("user_id, nome").in("user_id", atendenteIds);

        // Criar map de atendentes
        const atendenteMap = new Map<string, string>(atendentesData?.map(atendente => [atendente.user_id, atendente.nome] as [string, string]) || []);

        // Placar de atendentes
        const placarMap = new Map<string, AtendenteVenda>();
        vendasData.forEach(venda => {
          const atendenteId = venda.atendente_id;
          const nomeAtendente = atendenteMap.get(atendenteId) || "Desconhecido";
          if (placarMap.has(atendenteId)) {
            const atual = placarMap.get(atendenteId)!;
            placarMap.set(atendenteId, {
              nome: nomeAtendente,
              total: atual.total + venda.valor_venda,
              quantidade: atual.quantidade + 1
            });
          } else {
            placarMap.set(atendenteId, {
              nome: nomeAtendente,
              total: venda.valor_venda,
              quantidade: 1
            });
          }
        });
        const placar = Array.from(placarMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);
        setPlacarAtendentes(placar);
      }
    } catch (error) {
      console.error("Erro ao buscar indicadores:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return;
}