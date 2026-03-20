import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle2, Search, AlertCircle, Clock } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";

interface TarefaHistorico {
  id: string;
  descricao: string;
  responsavel_id: string;
  updated_at: string;
  data_referencia: string | null;
  status: string;
  recorrente: boolean;
  responsavel?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export default function ChecklistHistorico() {
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("todos");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const inicioSemanaAtual = useMemo(() => {
    return format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd");
  }, []);

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["tarefas-historico", inicioSemanaAtual],
    queryFn: async () => {
      // Fetch concluídas
      const { data: concluidas, error: err1 } = await supabase
        .from("tarefas")
        .select("id, descricao, responsavel_id, updated_at, data_referencia, status, recorrente")
        .eq("status", "concluida")
        .order("updated_at", { ascending: false });

      if (err1) throw err1;

      // Fetch recorrentes não concluídas de semanas passadas (atrasadas)
      const { data: naoConcluidas, error: err2 } = await supabase
        .from("tarefas")
        .select("id, descricao, responsavel_id, updated_at, data_referencia, status, recorrente")
        .eq("recorrente", true)
        .eq("status", "em_andamento")
        .lt("data_referencia", inicioSemanaAtual)
        .order("data_referencia", { ascending: false });

      if (err2) throw err2;

      // Fetch pendentes da semana atual (ainda abertas)
      const { data: pendentes, error: err3 } = await supabase
        .from("tarefas")
        .select("id, descricao, responsavel_id, updated_at, data_referencia, status, recorrente")
        .eq("status", "em_andamento")
        .gte("data_referencia", inicioSemanaAtual)
        .order("data_referencia", { ascending: false });

      if (err3) throw err3;

      const allTarefas = [...(concluidas || []), ...(naoConcluidas || []), ...(pendentes || [])];

      // Fetch responsaveis
      const responsavelIds = [...new Set(allTarefas.map((t: any) => t.responsavel_id).filter(Boolean))];
      let responsaveisMap: Record<string, { nome: string; foto_perfil_url?: string }> = {};

      if (responsavelIds.length > 0) {
        const { data: users } = await supabase
          .from("admin_users")
          .select("user_id, nome, foto_perfil_url")
          .in("user_id", responsavelIds);

        (users || []).forEach((u: any) => {
          responsaveisMap[u.user_id] = { nome: u.nome, foto_perfil_url: u.foto_perfil_url };
        });
      }

      return allTarefas.map((t: any) => ({
        ...t,
        recorrente: t.recorrente ?? false,
        responsavel: responsaveisMap[t.responsavel_id] || undefined,
      })) as TarefaHistorico[];
    },
  });

  const responsaveis = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; foto_perfil_url?: string }>();
    tarefas.forEach((t) => {
      if (t.responsavel_id && t.responsavel?.nome) {
        map.set(t.responsavel_id, {
          id: t.responsavel_id,
          nome: t.responsavel.nome,
          foto_perfil_url: t.responsavel.foto_perfil_url,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [tarefas]);

  const tarefasFiltradas = useMemo(() => {
    let resultado = tarefas;

    if (filtroResponsavel && filtroResponsavel !== "todos") {
      resultado = resultado.filter((t) => t.responsavel_id === filtroResponsavel);
    }

    if (filtroBusca.trim()) {
      const busca = filtroBusca.toLowerCase();
      resultado = resultado.filter((t) => t.descricao.toLowerCase().includes(busca));
    }

    if (filtroStatus === "concluidas") {
      resultado = resultado.filter((t) => t.status === "concluida");
    } else if (filtroStatus === "nao_concluidas") {
      resultado = resultado.filter((t) => t.status !== "concluida" && new Date(t.data_referencia || t.updated_at) < new Date(inicioSemanaAtual));
    } else if (filtroStatus === "pendentes") {
      resultado = resultado.filter((t) => t.status !== "concluida" && new Date(t.data_referencia || t.updated_at) >= new Date(inicioSemanaAtual));
    }

    if (dateRange?.from) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      resultado = resultado.filter((t) => {
        const d = t.data_referencia || t.updated_at;
        return new Date(d) >= from;
      });
    }
    if (dateRange?.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      resultado = resultado.filter((t) => {
        const d = t.data_referencia || t.updated_at;
        return new Date(d) <= to;
      });
    }

    resultado.sort((a, b) => {
      const da = new Date(a.data_referencia || a.updated_at).getTime();
      const db = new Date(b.data_referencia || b.updated_at).getTime();
      return db - da;
    });

    return resultado;
  }, [tarefas, filtroResponsavel, filtroBusca, filtroStatus, dateRange]);

  const totalConcluidas = tarefasFiltradas.filter((t) => t.status === "concluida").length;
  const totalNaoConcluidas = tarefasFiltradas.filter((t) => t.status !== "concluida" && new Date(t.data_referencia || t.updated_at) < new Date(inicioSemanaAtual)).length;
  const totalPendentes = tarefasFiltradas.filter((t) => t.status !== "concluida" && new Date(t.data_referencia || t.updated_at) >= new Date(inicioSemanaAtual)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <MinimalistLayout
      title="Histórico de Tarefas"
      subtitle={`${totalConcluidas} concluída${totalConcluidas !== 1 ? "s" : ""} · ${totalNaoConcluidas} não concluída${totalNaoConcluidas !== 1 ? "s" : ""}`}
      backPath="/direcao/checklist-lideranca"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Checklist Liderança", path: "/direcao/checklist-lideranca" },
        { label: "Histórico" },
      ]}
    >
      <div className="space-y-6">
        {/* Filtros */}
        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Buscar tarefa..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/30"
              />
            </div>

            {/* Status */}
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-white/10">
                <SelectItem value="todos" className="text-white/70 focus:bg-white/10 focus:text-white">Todos</SelectItem>
                <SelectItem value="concluidas" className="text-white/70 focus:bg-white/10 focus:text-white">Concluídas</SelectItem>
                <SelectItem value="nao_concluidas" className="text-white/70 focus:bg-white/10 focus:text-white">Não concluídas</SelectItem>
              </SelectContent>
            </Select>

            {/* Responsável */}
            <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-white/10">
                <SelectItem value="todos" className="text-white/70 focus:bg-white/10 focus:text-white">Todos</SelectItem>
                {responsaveis.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-white/70 focus:bg-white/10 focus:text-white">
                    {r.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white",
                    !dateRange?.from && "text-white/40"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0a1628] border-white/10" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto text-white")}
                />
                {dateRange?.from && (
                  <div className="p-2 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(undefined)}
                      className="w-full text-white/60 hover:text-white hover:bg-white/10"
                    >
                      Limpar período
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Lista */}
        {tarefasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <CheckCircle2 className="h-12 w-12 mb-3 text-white/20" />
            <p className="text-sm">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tarefasFiltradas.map((tarefa) => {
              const concluida = tarefa.status === "concluida";
              return (
                <div
                  key={tarefa.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                             hover:bg-white/[0.07] transition-colors duration-200"
                >
                  {concluida ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  )}

                  <span className={cn("flex-1 text-sm truncate", concluida ? "text-white/80" : "text-white/70")}>
                    {tarefa.descricao}
                  </span>

                  {!concluida && (
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] shrink-0">
                      Não concluída
                    </Badge>
                  )}

                  {tarefa.responsavel && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Avatar className="h-6 w-6">
                        {tarefa.responsavel.foto_perfil_url ? (
                          <AvatarImage src={tarefa.responsavel.foto_perfil_url} />
                        ) : null}
                        <AvatarFallback className="bg-blue-500/20 text-blue-300 text-[10px]">
                          {tarefa.responsavel.nome
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-white/50 hidden sm:inline">{tarefa.responsavel.nome.split(" ")[0]}</span>
                    </div>
                  )}

                  <span className="text-xs text-white/30 shrink-0">
                    {format(new Date(tarefa.data_referencia || tarefa.updated_at), "dd/MM/yy", { locale: ptBR })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
