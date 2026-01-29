import { Flame, Ruler, Package, CheckCircle, Paintbrush, Truck, Pencil, Trash2, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MetaColaborador } from "@/hooks/useMetasColaboradorIndividual";
import { format } from "date-fns";

interface MetaCardProps {
  meta: MetaColaborador;
  progressoAtual: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const tipoMetaConfig: Record<
  MetaColaborador["tipo_meta"],
  { label: string; icon: React.ElementType; cor: string; unidade: string }
> = {
  solda: { label: "Solda", icon: Flame, cor: "text-orange-500", unidade: "portas" },
  perfiladeira: { label: "Perfiladeira", icon: Ruler, cor: "text-blue-500", unidade: "m" },
  separacao: { label: "Separação", icon: Package, cor: "text-purple-500", unidade: "itens" },
  qualidade: { label: "Qualidade", icon: CheckCircle, cor: "text-green-500", unidade: "pedidos" },
  pintura: { label: "Pintura", icon: Paintbrush, cor: "text-pink-500", unidade: "m²" },
  carregamento: { label: "Expedição", icon: Truck, cor: "text-amber-500", unidade: "pedidos" },
};

export function MetaCard({ meta, progressoAtual, onEdit, onDelete }: MetaCardProps) {
  const config = tipoMetaConfig[meta.tipo_meta];
  const Icon = config.icon;
  
  const porcentagem = Math.min((progressoAtual / meta.valor_meta) * 100, 100);
  const dataTermino = new Date(meta.data_termino);
  const hoje = new Date();
  const diasRestantes = Math.ceil((dataTermino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const vencida = diasRestantes < 0 && !meta.concluida;
  const atingida = progressoAtual >= meta.valor_meta;

  return (
    <Card className={`border-border/50 ${vencida ? "border-destructive/50" : atingida ? "border-green-500/50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-muted ${config.cor}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{config.label}</h4>
              <p className="text-xs text-muted-foreground">
                {meta.valor_meta.toLocaleString("pt-BR")} {config.unidade}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progressoAtual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} / {meta.valor_meta.toLocaleString("pt-BR")}
            </span>
            <span className={`font-medium ${atingida ? "text-green-500" : ""}`}>
              {porcentagem.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={porcentagem} 
            className={`h-2 ${atingida ? "[&>div]:bg-green-500" : vencida ? "[&>div]:bg-destructive" : ""}`}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(meta.data_inicio), "dd/MM")} - {format(new Date(meta.data_termino), "dd/MM")}
            </span>
          </div>
          
          {meta.recompensa_valor > 0 && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <DollarSign className="h-3 w-3" />
              <span>R$ {meta.recompensa_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {atingida && !meta.concluida && (
          <div className="mt-2 text-xs text-green-600 font-medium text-center bg-green-500/10 py-1 rounded">
            🎉 Meta atingida!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
