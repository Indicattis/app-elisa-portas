import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Trophy, Gift, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetaProgressoBarProps {
  userId: string;
  tipoMeta: 'perfiladeira' | 'solda' | 'separacao' | 'qualidade' | 'pintura' | 'carregamento';
}

const UNIDADES: Record<string, string> = {
  perfiladeira: 'm',
  solda: ' portas',
  separacao: ' itens',
  qualidade: ' ordens',
  pintura: 'm²',
  carregamento: ' cargas',
};

export function MetaProgressoBar({ userId, tipoMeta }: MetaProgressoBarProps) {
  const queryClient = useQueryClient();

  const { data: metaInfo, isLoading } = useQuery({
    queryKey: ["meta-ativa-progresso", userId, tipoMeta],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      
      // Buscar meta ativa (dentro do período de vigência e não concluída)
      const { data: meta } = await supabase
        .from("metas_colaboradores")
        .select("*")
        .eq("user_id", userId)
        .eq("tipo_meta", tipoMeta)
        .eq("concluida", false)
        .lte("data_inicio", hoje)
        .gte("data_termino", hoje)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!meta) return null;

      // Calcular progresso via pontuacao_colaboradores
      let progresso = 0;
      
      switch (tipoMeta) {
        case 'perfiladeira': {
          const { data } = await supabase
            .from("pontuacao_colaboradores")
            .select("metragem_linear")
            .eq("user_id", userId)
            .eq("tipo_ranking", "perfiladeira")
            .gte("created_at", meta.data_inicio)
            .lte("created_at", meta.data_termino + "T23:59:59");
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.metragem_linear) || 0), 0);
          break;
        }
        case 'solda': {
          const { data } = await supabase
            .from("pontuacao_colaboradores")
            .select("porta_soldada")
            .eq("user_id", userId)
            .eq("tipo_ranking", "solda")
            .not("porta_soldada", "is", null)
            .gte("created_at", meta.data_inicio)
            .lte("created_at", meta.data_termino + "T23:59:59");
          progresso = (data || []).length;
          break;
        }
        case 'separacao': {
          const { data } = await supabase
            .from("pontuacao_colaboradores")
            .select("pedido_separado")
            .eq("user_id", userId)
            .eq("tipo_ranking", "separacao")
            .not("pedido_separado", "is", null)
            .gte("created_at", meta.data_inicio)
            .lte("created_at", meta.data_termino + "T23:59:59");
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.pedido_separado) || 0), 0);
          break;
        }
        case 'qualidade': {
          const { data } = await supabase
            .from("ordens_qualidade")
            .select("id")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino + "T23:59:59");
          progresso = (data || []).length;
          break;
        }
        case 'pintura': {
          const { data } = await supabase
            .from("pontuacao_colaboradores")
            .select("metragem_quadrada_pintada")
            .eq("user_id", userId)
            .eq("tipo_ranking", "pintura")
            .gte("created_at", meta.data_inicio)
            .lte("created_at", meta.data_termino + "T23:59:59");
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.metragem_quadrada_pintada) || 0), 0);
          break;
        }
        case 'carregamento': {
          const { data } = await (supabase
            .from("ordens_carregamento" as any)
            .select("id")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino + "T23:59:59") as any);
          progresso = (data || []).length;
          break;
        }
      }

      return {
        meta,
        progresso,
        porcentagem: Math.min((progresso / meta.valor_meta) * 100, 100),
        desbloqueada: meta.desbloqueada ?? false,
      };
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const desbloquearMutation = useMutation({
    mutationFn: async (metaId: string) => {
      const { error } = await supabase
        .from("metas_colaboradores")
        .update({ desbloqueada: true })
        .eq("id", metaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-ativa-progresso", userId, tipoMeta] });
      queryClient.invalidateQueries({ queryKey: ["metas-colaborador", userId] });
    },
  });

  if (!metaInfo || isLoading) return null;

  const { meta, progresso, porcentagem, desbloqueada } = metaInfo;
  const atingida = porcentagem >= 100;
  const unidade = UNIDADES[tipoMeta] || '';

  const formatarValor = (valor: number) => {
    if (tipoMeta === 'perfiladeira' || tipoMeta === 'pintura') {
      return valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return valor.toLocaleString('pt-BR');
  };

  const handleDesbloquear = () => {
    desbloquearMutation.mutate(meta.id);
  };

  // Estado Bloqueado - mostrar botão dourado
  if (!desbloqueada) {
    return (
      <div className="rounded-xl p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleDesbloquear}
            disabled={desbloquearMutation.isPending}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold px-8 py-3 shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30"
          >
            <Unlock className="mr-2 h-5 w-5" />
            {desbloquearMutation.isPending ? 'Desbloqueando...' : 'Desbloquear Meta'}
          </Button>
          
          {meta.recompensa_valor > 0 && (
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              <span className="text-xl font-bold text-amber-500">
                R$ {meta.recompensa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Estado Desbloqueado - mostrar barra de progresso
  return (
    <div className={`rounded-xl p-4 border ${
      atingida 
        ? 'border-green-500/30 bg-green-500/5' 
        : 'border-border/50 bg-card/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {atingida ? (
            <Trophy className="h-4 w-4 text-green-500" />
          ) : (
            <Target className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {atingida ? 'Meta Atingida!' : 'Meta Ativa'}
          </span>
        </div>
        <span className="text-sm font-medium">
          {formatarValor(progresso)}{unidade} / {formatarValor(meta.valor_meta)}{unidade}
        </span>
      </div>
      
      <Progress 
        value={porcentagem} 
        className={`h-2.5 ${atingida ? '[&>div]:bg-green-500' : ''}`} 
      />
      
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">
          {porcentagem.toFixed(0)}% concluído
        </span>
        {meta.recompensa_valor > 0 && (
          <div className="flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-amber-500" />
            <span className="text-lg font-bold text-amber-500">
              R$ {meta.recompensa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
