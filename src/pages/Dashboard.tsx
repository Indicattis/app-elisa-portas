import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Trophy, Medal, Award } from 'lucide-react';

interface DiaVenda {
  data: string;
  valor: number;
}

interface VendedorRanking {
  nome: string;
  total: number;
  posicao: number;
  foto_perfil_url?: string;
}

export default function Dashboard() {
  const [vendas, setVendas] = useState<Record<string, DiaVenda>>({});
  const [vendedores, setVendedores] = useState<VendedorRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const today = new Date();

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => prev === 0 ? 1 : 0);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchVendasMes(), fetchRankingVendedores()]);
  };

  const fetchVendasMes = async () => {
    setLoading(true);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const {
      data,
      error
    } = await supabase.from("contador_vendas_dias").select("data, valor").gte("data", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`).lte("data", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);
    if (error) {
      console.error("Erro ao buscar vendas:", error);
      setLoading(false);
      return;
    }
    
    // Agregar vendas por data (somar todos os atendentes)
    const map: Record<string, DiaVenda> = {};
    data?.forEach((row: any) => {
      const existingValue = map[row.data]?.valor || 0;
      map[row.data] = {
        data: row.data,
        valor: existingValue + Number(row.valor)
      };
    });
    setVendas(map);
    setLoading(false);
  };

  const fetchRankingVendedores = async () => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    const { data, error } = await supabase
      .from("contador_vendas_dias")
      .select(`
        atendente_id,
        valor,
        admin_users!atendente_id(nome, foto_perfil_url)
      `)
      .gte("data", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .lte("data", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);
    
    if (error) {
      console.error("Erro ao buscar ranking:", error);
      return;
    }

    // Agregar vendas por vendedor
    const vendedoresMap = new Map<string, { nome: string; total: number; foto_perfil_url?: string }>();
    
    data?.forEach((venda: any) => {
      const nome = venda.admin_users?.nome || 'Vendedor';
      const foto_perfil_url = venda.admin_users?.foto_perfil_url;
      const existing = vendedoresMap.get(venda.atendente_id) || { nome, total: 0, foto_perfil_url };
      vendedoresMap.set(venda.atendente_id, {
        nome,
        foto_perfil_url,
        total: existing.total + Number(venda.valor)
      });
    });

    // Converter para array e ordenar
    const ranking = Array.from(vendedoresMap.values())
      .sort((a, b) => b.total - a.total)
      .map((vendedor, index) => ({
        ...vendedor,
        posicao: index + 1
      }));

    setVendedores(ranking);
  };

  const totalVendasMes = useMemo(() => {
    return Object.values(vendas).reduce((sum, venda) => sum + venda.valor, 0);
  }, [vendas]);

  const chartData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const venda = vendas[dateStr];
      data.push({
        dia: day,
        valor: venda ? venda.valor : 0
      });
    }
    return data;
  }, [vendas]);

  const getRankingIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Award className="h-8 w-8 text-amber-600" />;
      default: return <div className="h-8 w-8 flex items-center justify-center bg-muted rounded-full text-lg font-bold">{posicao}</div>;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Slide Container */}
      <div 
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {/* Slide 1: Faturamento */}
        <div className="min-w-full flex-shrink-0">
          <div className="min-h-screen flex flex-col items-center justify-start p-6 space-y-8">
            {/* Logo */}
            <div className="mt-8">
              <img src="/lovable-uploads/31df71a1-a366-49f8-81f7-acee745d5a32.png" alt="Grupo Elisa" className="h-20 w-auto" />
            </div>
            
            {/* Título Faturamento */}
            <h1 className="text-6xl font-bold text-foreground">Faturamento</h1>
            
            {/* Contador das vendas do mês */}
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl px-12 py-8 w-full max-w-4xl flex items-center justify-center" style={{
              height: '120px'
            }}>
              <div className="text-center">
                {loading ? (
                  <div className="text-7xl font-impact font-medium text-white">
                    Carregando...
                  </div>
                ) : (
                  <div className="text-7xl font-impact font-medium text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalVendasMes)}
                  </div>
                )}
              </div>
            </div>

            {/* Data e hora atual */}
            <div className="text-center text-muted-foreground space-y-3">
              <div className="text-xl font-semibold">
                {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              
              {/* Linha horizontal */}
              <div className="w-32 h-0.5 bg-muted-foreground mx-auto"></div>
              
              <div className="text-lg">
                {format(today, "dd/MM/yyyy - HH:mm", { locale: ptBR })}
              </div>
            </div>

            {/* Gráfico de vendas diárias */}
            <div className="w-full max-w-6xl mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                Vendas Diárias do Mês
              </h2>
              <div className="bg-card rounded-lg p-6 shadow-lg">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dia" 
                      label={{ value: 'Dia do Mês', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => [
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(value),
                        'Vendas'
                      ]}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    {/* Linhas de referência para os marcos de valores */}
                    <ReferenceLine y={20000} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                    <ReferenceLine y={50000} stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" />
                    <ReferenceLine y={75000} stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" />
                    
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 2: Ranking */}
        <div className="min-w-full flex-shrink-0">
          <div className="min-h-screen flex flex-col items-center justify-start p-6 space-y-8">
            {/* Logo */}
            <div className="mt-8">
              <img src="/lovable-uploads/31df71a1-a366-49f8-81f7-acee745d5a32.png" alt="Grupo Elisa" className="h-20 w-auto" />
            </div>
            
            {/* Título Ranking */}
            <h1 className="text-6xl font-bold text-foreground">Ranking</h1>
            <h2 className="text-2xl text-muted-foreground">Melhores Vendedores do Mês</h2>
            
            {/* Data atual */}
            <div className="text-center text-muted-foreground">
              <div className="text-xl font-semibold">
                {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>

            {/* Lista de ranking */}
            <div className="w-full max-w-4xl space-y-4">
              {vendedores.slice(0, 10).map((vendedor) => (
                <div 
                  key={`${vendedor.nome}-${vendedor.posicao}`}
                  className={`flex items-center justify-between p-6 rounded-lg shadow-lg transition-all duration-300 ${
                    vendedor.posicao === 1 
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400' 
                      : vendedor.posicao === 2 
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400'
                        : vendedor.posicao === 3
                          ? 'bg-gradient-to-r from-amber-100 to-amber-200 border-2 border-amber-600'
                          : 'bg-card border border-border'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {getRankingIcon(vendedor.posicao)}
                    
                    {/* Foto do vendedor */}
                    <div className="relative">
                      {vendedor.foto_perfil_url ? (
                        <img 
                          src={vendedor.foto_perfil_url} 
                          alt={`Foto de ${vendedor.nome}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-md ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                        {vendedor.nome.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className={`text-xl font-bold ${vendedor.posicao <= 3 ? 'text-gray-800' : 'text-foreground'}`}>
                        {vendedor.nome}
                      </h3>
                      <p className={`text-sm ${vendedor.posicao <= 3 ? 'text-gray-600' : 'text-muted-foreground'}`}>
                        {vendedor.posicao}º lugar
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${vendedor.posicao <= 3 ? 'text-gray-800' : 'text-foreground'}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(vendedor.total)}
                    </div>
                  </div>
                </div>
              ))}
              
              {vendedores.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">Nenhuma venda registrada este mês</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[0, 1].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index 
                ? 'bg-primary scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}