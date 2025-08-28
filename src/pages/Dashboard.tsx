import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    const map: Record<string, DiaVenda> = {};
    data?.forEach((row: any) => {
      map[row.data] = {
        data: row.data,
        valor: Number(row.valor)
      };
    });
    setVendas(map);
    setLoading(false);
  };
  const totalVendasMes = useMemo(() => {
    return Object.values(vendas).reduce((sum, venda) => sum + venda.valor, 0);
  }, [vendas]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
      {/* Título Faturamento */}
      <h1 className="text-4xl font-bold text-foreground">Faturamento</h1>
      
      {/* Contador das vendas do mês */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl px-12 py-8 w-full max-w-4xl flex items-center justify-center" style={{
        height: '120px'
      }}>
        <div className="text-center">
          {loading ? (
            <div className="text-5xl font-black text-yellow-900">
              Carregando...
            </div>
          ) : (
            <div className="text-5xl font-black text-yellow-900">
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
      <div className="text-center text-muted-foreground space-y-1">
        <div className="text-xl font-semibold">
          {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <div className="text-lg">
          {format(today, "dd/MM/yyyy - HH:mm", { locale: ptBR })}
        </div>
      </div>
    </div>
  );
}