import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings2, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { useCustosMensais } from "@/hooks/useCustosMensais";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

const MESES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CustosGridMinimalista() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());
  const { totaisPorMes, loading, fetchTotaisPorMes } = useCustosMensais();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchTotaisPorMes(ano);
  }, [ano, fetchTotaisPorMes]);

  const handleMonthClick = (monthIndex: number) => {
    const mesFormatado = `${ano}-${String(monthIndex + 1).padStart(2, "0")}`;
    navigate(`/administrativo/financeiro/custos/${mesFormatado}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatedBreadcrumb
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Custos" },
        ]}
        mounted={mounted}
      />

      <FloatingProfileMenu mounted={mounted} />

      <button
        onClick={() => navigate("/administrativo/financeiro")}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateX(0)" : "translateX(-20px)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="container mx-auto p-6 pt-20 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Custos {ano}</h1>
            <p className="text-white/60">
              Selecione um mês para lançar os custos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAno(ano - 1)}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {ano - 1}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAno(currentYear)}
              className={cn(
                "border-white/20 text-white",
                ano === currentYear ? "bg-blue-600 hover:bg-blue-700 border-blue-500" : "bg-white/5 hover:bg-white/10"
              )}
            >
              {currentYear}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAno(ano + 1)}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {ano + 1}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/administrativo/financeiro/custos/configurar")}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurar Tipos
            </Button>
          </div>
        </div>

        {/* Grid 3x4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {MESES_NOMES.map((nomeMes, index) => {
            const isCurrentMonth = ano === currentYear && index === currentMonth;
            const dados = totaisPorMes[index];
            const totalReal = dados?.total_real || 0;
            const totalLimite = dados?.total_limite || 0;
            const percentual = totalLimite > 0 ? (totalReal / totalLimite) * 100 : 0;

            return (
              <Card
                key={index}
                onClick={() => handleMonthClick(index)}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isCurrentMonth
                    ? "bg-blue-500 border-blue-400 hover:bg-blue-400"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <CardContent className="p-4">
                  <p
                    className={cn(
                      "text-sm font-medium mb-2",
                      isCurrentMonth ? "text-white" : "text-white/60"
                    )}
                  >
                    {nomeMes}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(totalReal)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p
                      className={cn(
                        "text-xs",
                        isCurrentMonth ? "text-white/70" : "text-white/40"
                      )}
                    >
                      Limite: {formatCurrency(totalLimite)}
                    </p>
                    {totalLimite > 0 && (
                      <p
                        className={cn(
                          "text-xs font-medium",
                          percentual > 100
                            ? "text-red-400"
                            : percentual > 80
                            ? "text-amber-400"
                            : isCurrentMonth
                            ? "text-white/80"
                            : "text-green-400"
                        )}
                      >
                        {percentual.toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {/* Progress bar */}
                  {totalLimite > 0 && (
                    <div className={cn(
                      "mt-2 h-1 rounded-full overflow-hidden",
                      isCurrentMonth ? "bg-white/20" : "bg-white/10"
                    )}>
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          percentual > 100
                            ? "bg-red-400"
                            : percentual > 80
                            ? "bg-amber-400"
                            : "bg-green-400"
                        )}
                        style={{ width: `${Math.min(percentual, 100)}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
