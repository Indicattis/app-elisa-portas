import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DiaVenda {
  data: string;
  valor: number;
}

export default function Performance() {
  const [vendas, setVendas] = useState<Record<string, DiaVenda>>({});
  const [loading, setLoading] = useState(false);
  const today = new Date();

  useEffect(() => {
    fetchVendasMes();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchVendasMes, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Performance</h1>
        <p className="text-xl text-muted-foreground">
          Análise de vendas do mês de {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Gráfico de vendas diárias */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          Vendas Diárias do Mês
        </h2>
        <div className="bg-card rounded-lg p-6 shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-xl text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}