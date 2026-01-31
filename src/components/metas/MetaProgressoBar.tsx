import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Gift } from "lucide-react";
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
  const { data: metaInfo } = useQuery({
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

      // Calcular progresso respeitando datas da meta
      let progresso = 0;
      
      switch (tipoMeta) {
        case 'perfiladeira': {
          const { data } = await supabase
            .from("ordens_perfiladeira")
            .select("metragem_linear")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino);
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.metragem_linear) || 0), 0);
          break;
        }
        case 'solda': {
          const { data } = await supabase
            .from("ordens_soldagem")
            .select("qtd_portas_p, qtd_portas_g")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino);
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.qtd_portas_p) || 0) + (Number(item.qtd_portas_g) || 0), 0);
          break;
        }
        case 'separacao': {
          const { data } = await supabase
            .from("ordens_separacao")
            .select("quantidade_itens")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino);
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.quantidade_itens) || 0), 0);
          break;
        }
        case 'qualidade': {
          const { data } = await supabase
            .from("ordens_qualidade")
            .select("id")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino);
          progresso = (data || []).length;
          break;
        }
        case 'pintura': {
          const { data } = await supabase
            .from("ordens_pintura")
            .select("metragem_quadrada")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino);
          progresso = (data || []).reduce((acc: number, item: any) => 
            acc + (Number(item.metragem_quadrada) || 0), 0);
          break;
        }
        case 'carregamento': {
          const { data } = await (supabase
            .from("ordens_carregamento" as any)
            .select("id")
            .eq("responsavel_id", userId)
            .eq("status", "concluido")
            .gte("data_conclusao", meta.data_inicio)
            .lte("data_conclusao", meta.data_termino) as any);
          progresso = (data || []).length;
          break;
        }
      }

      return {
        meta,
        progresso,
        porcentagem: Math.min((progresso / meta.valor_meta) * 100, 100),
      };
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  if (!metaInfo) return null;

  const { meta, progresso, porcentagem } = metaInfo;
  const atingida = porcentagem >= 100;
  const unidade = UNIDADES[tipoMeta] || '';

  const formatarValor = (valor: number) => {
    if (tipoMeta === 'perfiladeira' || tipoMeta === 'pintura') {
      return valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return valor.toLocaleString('pt-BR');
  };

  return (
    <div className={`rounded-lg p-3 border ${
      atingida 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-primary/5 border-primary/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {atingida ? (
            <Trophy className="h-4 w-4 text-green-500" />
          ) : (
            <Target className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">
            {atingida ? 'Meta Atingida!' : 'Meta Ativa'}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatarValor(progresso)}{unidade} / {formatarValor(meta.valor_meta)}{unidade}
        </span>
      </div>
      
      <Progress 
        value={porcentagem} 
        className={`h-2 ${atingida ? '[&>div]:bg-green-500' : ''}`} 
      />
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {porcentagem.toFixed(0)}% concluído
        </span>
        {meta.recompensa_valor > 0 && (
          <span className="text-xs flex items-center gap-1 text-amber-600">
            <Gift className="h-3 w-3" />
            R$ {meta.recompensa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}
