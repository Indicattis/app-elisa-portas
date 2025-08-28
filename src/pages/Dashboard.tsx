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
    
    const { data, error } = await supabase
      .from("contador_vendas_dias")
      .select("data, valor")
      .gte("data", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .lte("data", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);

    if (error) {
      console.error("Erro ao buscar vendas:", error);
      setLoading(false);
      return;
    }

    const map: Record<string, DiaVenda> = {};
    data?.forEach((row: any) => {
      map[row.data] = { data: row.data, valor: Number(row.valor) };
    });
    setVendas(map);
    setLoading(false);
  };

  const totalVendasMes = useMemo(() => {
    return Object.values(vendas).reduce((sum, venda) => sum + venda.valor, 0);
  }, [vendas]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Contador das vendas do mês */}
      <div 
        className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl px-12 py-8 w-full max-w-4xl flex items-center justify-between"
        style={{ height: '120px' }}
      >
        <div className="text-left">
          <h2 className="text-lg font-medium text-yellow-900 mb-1">
            Vendas de {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <p className="text-sm text-yellow-800">
            {Object.keys(vendas).length} dias registrados
          </p>
        </div>
        
        <div className="text-right">
          {loading ? (
            <div className="text-4xl font-bold text-yellow-900">
              Carregando...
            </div>
          ) : (
            <div className="text-4xl font-bold text-yellow-900">
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
    </div>
  );
}