import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DiaVenda {
  data: string;
  valor: number;
}
export default function Dashboard() {
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
  return (
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
  );
}