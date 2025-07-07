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
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchIndicadores();
  }, []);

  const fetchIndicadores = async () => {
    try {
      // Buscar total de negociações (valor_orcamento de todos os leads)
      const { data: leadsData, error: leadsError } = await supabase
        .from("elisaportas_leads")
        .select("valor_orcamento")
        .not("valor_orcamento", "is", null);

      if (leadsError) throw leadsError;

      const totalNegs = leadsData?.reduce((acc, lead) => acc + (lead.valor_orcamento || 0), 0) || 0;
      setTotalNegociacoes(totalNegs);

      // Buscar vendas
      const { data: vendasData, error: vendasError } = await supabase
        .from("vendas")
        .select("valor_venda, data_venda, atendente_id");

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
        const { data: atendentesData } = await supabase
          .from("admin_users")
          .select("user_id, nome")
          .in("user_id", atendenteIds);

        // Criar map de atendentes
        const atendenteMap = new Map(atendentesData?.map(atendente => [atendente.user_id, atendente.nome]) || []);

        // Placar de atendentes
        const placarMap = new Map<string, AtendenteVenda>();
        
        vendasData.forEach((venda) => {
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

        const placar = Array.from(placarMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        
        setPlacarAtendentes(placar);
      }
    } catch (error) {
      console.error("Erro ao buscar indicadores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Negociações</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {totalNegociacoes.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor total de orçamentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {totalVendas.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor total vendido
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {vendasMes}
          </div>
          <p className="text-xs text-muted-foreground">
            Vendas realizadas este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Atendente</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {placarAtendentes[0]?.nome || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {placarAtendentes[0] ? `R$ ${placarAtendentes[0].total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem vendas"}
          </p>
        </CardContent>
      </Card>

      {isAdmin && placarAtendentes.length > 1 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Placar de Vendas</CardTitle>
            <CardDescription>
              Top 5 atendentes por valor vendido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {placarAtendentes.map((atendente, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{atendente.nome}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      R$ {atendente.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {atendente.quantidade} venda{atendente.quantidade !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
