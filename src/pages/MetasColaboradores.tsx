import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Flame, Ruler, Package, CheckCircle, Paintbrush, Truck, User, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMetasColaboradores } from "@/hooks/useMetasColaboradores";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MetasColaboradores() {
  const navigate = useNavigate();
  const { data: colaboradores, isLoading } = useMetasColaboradores();

  // Buscar user_ids que têm metas individuais ativas
  const { data: usersComMetas } = useQuery({
    queryKey: ["users-com-metas-individuais"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .select("user_id")
        .gte("data_termino", hoje)
        .eq("concluida", false);

      if (error) {
        console.error("Erro ao buscar metas individuais:", error);
        return new Set<string>();
      }

      return new Set(data?.map((m) => m.user_id) || []);
    },
  });

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const formatNumber = (value: number, decimals = 0) => {
    return value.toFixed(decimals).replace(".", ",");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/direcao/metas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Metas de Produção</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {/* Period Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold capitalize">{mesAtual}</h2>
          <p className="text-sm text-muted-foreground">
            Desempenho dos colaboradores da fábrica
          </p>
        </div>

        {/* Column Headers */}
        <div className="hidden md:grid md:grid-cols-[1fr,60px,repeat(6,80px)] gap-2 px-4 py-2 mb-2 text-xs font-medium text-muted-foreground">
          <div>Colaborador</div>
          <div className="text-center flex flex-col items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span>Metas</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <Flame className="h-4 w-4" />
            <span>Solda</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <Ruler className="h-4 w-4" />
            <span>Perfil (m)</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <Package className="h-4 w-4" />
            <span>Separação</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Qualidade</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <Paintbrush className="h-4 w-4" />
            <span>Pintura (m²)</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>Expedição</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!colaboradores || colaboradores.length === 0) && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum colaborador encontrado
            </p>
          </div>
        )}

        {/* Collaborator List */}
        <div className="space-y-2">
          {colaboradores?.map((colaborador) => (
            <div
              key={colaborador.user_id}
              className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/direcao/metas/${colaborador.user_id}`)}
            >
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(colaborador.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{colaborador.nome}</span>
                  {usersComMetas?.has(colaborador.user_id) && (
                    <Trophy className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {colaborador.solda_qtd > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Flame className="h-3.5 w-3.5" />
                      <span>{colaborador.solda_qtd}</span>
                    </div>
                  )}
                  {colaborador.perfiladeira_metros > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{formatNumber(colaborador.perfiladeira_metros, 1)}m</span>
                    </div>
                  )}
                  {colaborador.separacao_qtd > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span>{colaborador.separacao_qtd}</span>
                    </div>
                  )}
                  {colaborador.qualidade_qtd > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{colaborador.qualidade_qtd}</span>
                    </div>
                  )}
                  {colaborador.pintura_m2 > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Paintbrush className="h-3.5 w-3.5" />
                      <span>{formatNumber(colaborador.pintura_m2, 1)}m²</span>
                    </div>
                  )}
                  {colaborador.carregamento_qtd > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      <span>{colaborador.carregamento_qtd}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-[1fr,60px,repeat(6,80px)] gap-2 items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(colaborador.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{colaborador.nome}</span>
                </div>
                <div className="text-center">
                  {usersComMetas?.has(colaborador.user_id) ? (
                    <Trophy className="h-5 w-5 text-amber-500 mx-auto" />
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>
                <div className="text-center font-medium">
                  {colaborador.solda_qtd > 0 ? colaborador.solda_qtd : ''}
                </div>
                <div className="text-center font-medium">
                  {colaborador.perfiladeira_metros > 0 ? `${formatNumber(colaborador.perfiladeira_metros, 1)}m` : ''}
                </div>
                <div className="text-center font-medium">
                  {colaborador.separacao_qtd > 0 ? colaborador.separacao_qtd : ''}
                </div>
                <div className="text-center font-medium">
                  {colaborador.qualidade_qtd > 0 ? colaborador.qualidade_qtd : ''}
                </div>
                <div className="text-center font-medium">
                  {colaborador.pintura_m2 > 0 ? formatNumber(colaborador.pintura_m2, 1) : ''}
                </div>
                <div className="text-center font-medium">
                  {colaborador.carregamento_qtd > 0 ? colaborador.carregamento_qtd : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
