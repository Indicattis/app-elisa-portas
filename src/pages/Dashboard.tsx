
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Fundo espacial animado */}
      <div className="absolute inset-0">
        {/* Nebulosa de fundo */}
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent animate-pulse" />
        
        {/* Estrelas pequenas */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Estrelas grandes brilhantes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`big-star-${i}`}
            className="absolute w-2 h-2 bg-gradient-to-r from-yellow-300 to-white rounded-full shadow-lg animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))',
            }}
          />
        ))}

        {/* Galáxia espiral em movimento */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 opacity-30">
          <div className="w-full h-full bg-gradient-conic from-purple-500 via-blue-500 to-purple-500 rounded-full animate-spin" 
               style={{ animationDuration: '20s' }} />
        </div>

        {/* Planetas em órbita */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 animate-spin" style={{ animationDuration: '30s' }}>
          <div className="absolute top-0 left-1/2 w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transform -translate-x-1/2 shadow-lg" />
        </div>
        
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 animate-spin" style={{ animationDuration: '40s' }}>
          <div className="absolute top-0 left-1/2 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transform -translate-x-1/2 shadow-lg" />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-8">
          {/* Título */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
              DASHBOARD
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium">
              {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Contador principal com estilo tecnológico dourado */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse" />
            
            {/* Container principal */}
            <div className="relative bg-gradient-to-br from-yellow-900/90 via-yellow-800/90 to-yellow-900/90 backdrop-blur-xl border-2 border-yellow-400/50 rounded-3xl p-12 md:p-16 shadow-2xl">
              {/* Padrão hexagonal de fundo */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.3)_1px,transparent_1px)] bg-[length:40px_40px]" />
              </div>
              
              {/* Bordas internas brilhantes */}
              <div className="absolute inset-4 border border-yellow-300/30 rounded-2xl" />
              
              {/* Conteúdo */}
              <div className="relative space-y-6">
                <div className="text-lg md:text-xl text-yellow-200/80 font-medium tracking-wide uppercase">
                  Vendas do Mês
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    <div className="text-6xl md:text-8xl font-bold text-yellow-300 animate-pulse">
                      ---
                    </div>
                    <div className="text-yellow-200/60">Carregando...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-6xl md:text-8xl font-bold bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(totalVendasMes)}
                    </div>
                    
                    {/* Indicador de performance */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                        <span className="text-yellow-200/80 text-sm md:text-base">
                          {Object.keys(vendas).length} dias registrados
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Cantos decorativos */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400/50" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400/50" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400/50" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400/50" />
            </div>
          </div>

          {/* Texto motivacional */}
          <div className="text-white/60 text-lg md:text-xl font-light max-w-2xl mx-auto">
            Navegando pelo universo dos negócios
          </div>
        </div>
      </div>

      {/* Partículas flutuantes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}
