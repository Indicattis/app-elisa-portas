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

  const getVendedorCategory = (valor: number) => {
    if (valor >= 1500000) return { name: 'Orion', color: 'from-slate-300 to-slate-100', border: 'border-slate-300' };
    if (valor >= 1000000) return { name: 'Ômega', color: 'from-red-400 to-red-300', border: 'border-red-400' };
    if (valor >= 800000) return { name: 'Omni', color: 'from-purple-400 to-purple-300', border: 'border-purple-400' };
    if (valor >= 600000) return { name: 'Gama', color: 'from-emerald-400 to-emerald-300', border: 'border-emerald-400' };
    if (valor >= 500000) return { name: 'Alfa', color: 'from-yellow-400 to-yellow-300', border: 'border-yellow-400' };
    if (valor >= 400000) return { name: 'Beta', color: 'from-gray-400 to-gray-300', border: 'border-gray-400' };
    if (valor >= 300000) return { name: 'Zeta', color: 'from-amber-600 to-amber-500', border: 'border-amber-600' };
    return { name: 'Iniciante', color: 'from-slate-500 to-slate-400', border: 'border-slate-500' };
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
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

            {/* Container principal com ranking e legendas */}
            <div className="w-full max-w-7xl flex gap-8 overflow-x-hidden">
              {/* Lista de ranking */}
              <div className="flex-1 space-y-4 min-w-0">
                {vendedores.slice(0, 10).map((vendedor) => {
                  const category = getVendedorCategory(vendedor.total);
                  return (
                    <div 
                      key={`${vendedor.nome}-${vendedor.posicao}`}
                      className="flex items-center justify-between p-8 rounded-lg bg-card border border-border shadow-lg"
                    >
                      <div className="flex items-center space-x-6">
                        {/* Foto do vendedor com borda colorida */}
                        <div className="relative">
                          {vendedor.foto_perfil_url ? (
                            <img 
                              src={vendedor.foto_perfil_url} 
                              alt={`Foto de ${vendedor.nome}`}
                              className={`w-24 h-24 2xl:w-32 2xl:h-32 rounded-full object-cover border-4 ${category.border} shadow-md`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-24 h-24 2xl:w-32 2xl:h-32 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-2xl 2xl:text-3xl shadow-md border-4 ${category.border} ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                            {vendedor.nome.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-2xl 2xl:text-4xl font-bold text-foreground">
                            {vendedor.nome}
                          </h3>
                          <div className={`inline-block px-4 py-2 rounded-full text-lg 2xl:text-xl font-semibold text-white bg-gradient-to-r ${category.color}`}>
                            Vendedor {category.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl 2xl:text-5xl font-bold text-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(vendedor.total)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {vendedores.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground">Nenhuma venda registrada este mês</p>
                  </div>
                )}
              </div>

              {/* Legendas das metas - lado direito */}
              <div className="w-80 xl:w-96 2xl:w-[26rem] bg-card rounded-lg p-6 xl:p-8 2xl:p-10 border border-border shadow-lg flex-shrink-0">
                <h3 className="text-2xl 2xl:text-3xl font-bold text-foreground mb-6 text-center">Metas Individuais</h3>
                <div className="space-y-4 2xl:space-y-6">
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/4.png" alt="Vendedor Zeta" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Zeta</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">R$ 300k - R$ 400k</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/5.png" alt="Vendedor Beta" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Beta</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">R$ 400k - R$ 500k</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/6.png" alt="Vendedor Alfa" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Alfa</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">R$ 500k - R$ 600k</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/7.png" alt="Vendedor Gama" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Gama</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">R$ 600k - R$ 800k</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/3.png" alt="Vendedor Omni" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Omni</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">R$ 800k - R$ 1M</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/2.png" alt="Vendedor Ômega" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Ômega</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">R$ 1M - R$ 1.5M</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 2xl:p-4 rounded-lg">
                    <div className="w-16 h-16 2xl:w-20 2xl:h-20 flex items-center justify-center flex-shrink-0">
                      <img src="/lovable-uploads/1.png" alt="Vendedor Orion" className="w-16 h-16 2xl:w-20 2xl:h-20" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg 2xl:text-xl">Vendedor Orion</div>
                      <div className="text-base 2xl:text-lg text-muted-foreground">Acima R$ 1.5M</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Iniciante</div>
                      <div className="text-xs text-muted-foreground">Abaixo R$ 300k</div>
                    </div>
                  </div>
                </div>
              </div>
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