import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { cn } from "@/lib/utils";

interface NeoInstalacaoRowProps {
  neoInstalacao: NeoInstalacao;
  onConcluir: (neoInstalacao: NeoInstalacao) => void;
  isConcluindo: boolean;
}

export function NeoInstalacaoRow({ 
  neoInstalacao, 
  onConcluir, 
  isConcluindo 
}: NeoInstalacaoRowProps) {
  const { 
    nome_cliente, 
    cidade, 
    estado, 
    data_instalacao, 
    equipe_nome, 
    autorizado_nome,
    tipo_responsavel,
    criador 
  } = neoInstalacao;
  
  const responsavelNome = tipo_responsavel === 'autorizado' ? autorizado_nome : equipe_nome;
  
  // Verificar se está atrasado
  const isAtrasado = (): boolean => {
    if (!data_instalacao) return false;
    const dataInst = new Date(data_instalacao);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataInst.setHours(0, 0, 0, 0);
    return dataInst < hoje;
  };
  
  const atrasado = isAtrasado();
  
  return (
    <div 
      className={cn(
        "h-[35px] grid items-center gap-2 px-3 rounded-md border bg-card/50 text-sm transition-colors hover:bg-muted/50",
        atrasado && "border-red-500/50 bg-red-500/5"
      )}
      style={{ 
        gridTemplateColumns: "28px 60px 1fr 100px 90px 100px 50px" 
      }}
    >
      {/* Avatar do criador */}
      <div className="flex items-center justify-center">
        {criador ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6">
                <AvatarImage src={criador.foto_perfil_url || undefined} />
                <AvatarFallback className="text-[10px] bg-orange-500/20 text-orange-600">
                  {criador.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              Criado por {criador.nome}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="h-6 w-6 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-[10px] text-orange-600 font-bold">?</span>
          </div>
        )}
      </div>
      
      {/* Badge AVULSO */}
      <div className="flex items-center">
        <Badge 
          variant="outline" 
          className="text-[10px] h-5 px-1.5 bg-orange-500/20 text-orange-600 border-orange-500/50 font-semibold"
        >
          AVULSO
        </Badge>
      </div>
      
      {/* Cliente */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate text-orange-600">{nome_cliente}</span>
        {atrasado && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1">
            Atrasado
          </Badge>
        )}
      </div>
      
      {/* Cidade/Estado */}
      <div className="flex items-center gap-1 text-muted-foreground text-xs truncate">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {cidade && estado ? `${cidade}/${estado}` : cidade || estado || "—"}
        </span>
      </div>
      
      {/* Data agendada */}
      <div className="flex items-center gap-1 text-xs">
        <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className={cn(
          atrasado ? "text-red-600 font-medium" : "text-muted-foreground"
        )}>
          {data_instalacao 
            ? format(new Date(data_instalacao), "dd/MM/yy", { locale: ptBR })
            : "Não agendado"
          }
        </span>
      </div>
      
      {/* Equipe/Autorizado responsável */}
      <div className="flex items-center gap-1 text-xs truncate">
        <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className={cn(
          "truncate",
          tipo_responsavel === 'autorizado' ? "text-emerald-600" : "text-muted-foreground"
        )}>
          {responsavelNome || "—"}
        </span>
      </div>
      
      {/* Botão Concluir */}
      <div className="flex items-center justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onConcluir(neoInstalacao)}
              disabled={isConcluindo}
              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-500/10"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Concluir instalação</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
