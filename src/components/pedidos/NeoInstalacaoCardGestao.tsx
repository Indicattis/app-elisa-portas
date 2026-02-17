import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CronometroEtapaBadge } from "./CronometroEtapaBadge";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Hammer,
  Users,
  FileText,
  DollarSign,
  Undo2,
  GripVertical
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { formatCurrency } from "@/lib/utils";

interface NeoInstalacaoCardGestaoProps {
  neoInstalacao: NeoInstalacao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
  showConcluido?: boolean;
  onRetornar?: (id: string) => void;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
}

export function NeoInstalacaoCardGestao({
  neoInstalacao,
  viewMode = 'grid',
  onConcluir,
  isConcluindo,
  showConcluido = false,
  onRetornar,
  dragHandleProps,
  isDragging,
}: NeoInstalacaoCardGestaoProps) {
  const corEquipe = neoInstalacao.equipe?.cor || "#6366f1";

  // Dados do criador
  const criadorNome = neoInstalacao.criador?.nome || 'Desconhecido';
  const criadorFoto = neoInstalacao.criador?.foto_perfil_url;
  const criadorIniciais = criadorNome
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const atrasado = (() => {
    const dataStr = neoInstalacao.data_instalacao;
    if (!dataStr) return false;
    const data = new Date(dataStr + 'T12:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);
    return data < hoje;
  })();

  if (viewMode === 'list') {
    return (
      <TooltipProvider>
        <Card className="hover:shadow-sm transition-all h-10 overflow-hidden">
          <CardContent className="p-0 h-full">
            {/* Grid layout IDÊNTICO ao PedidoCard */}
            <div 
              className="grid items-center gap-1.5 h-full px-2 w-full" 
              style={{ gridTemplateColumns: '20px 20px 180px 100px 20px 40px 40px 80px 70px 150px 50px 80px 24px 24px 24px 24px 24px 24px 1fr 55px' }}
            >
              {/* Col 1: Drag handle */}
              <div className="flex items-center justify-center">
                {dragHandleProps ? (
                  <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing touch-none">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                  </div>
                ) : null}
              </div>
              
              {/* Col 2: Avatar do criador */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={criadorFoto || undefined} alt={criadorNome} />
                    <AvatarFallback className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/50">
                      {criadorIniciais}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Criado por: {criadorNome}</p>
                  <p className="text-[10px] text-muted-foreground">Instalação Avulsa</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Col 3: Nome do cliente */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {neoInstalacao.nome_cliente && neoInstalacao.nome_cliente.length > 20 
                        ? `${neoInstalacao.nome_cliente.substring(0, 20)}...` 
                        : neoInstalacao.nome_cliente}
                    </h3>
                    {neoInstalacao.descricao && (
                      <p className="text-[9px] text-muted-foreground truncate leading-tight -mt-0.5">
                        {neoInstalacao.descricao}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{neoInstalacao.nome_cliente}</p>
                  {neoInstalacao.descricao && (
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[250px]">{neoInstalacao.descricao}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Col 4: Cidade/Estado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center text-center">
                    <span className="text-[10px] text-muted-foreground truncate">
                      {neoInstalacao.cidade && neoInstalacao.estado 
                        ? `${neoInstalacao.cidade}/${neoInstalacao.estado}`
                        : neoInstalacao.cidade || neoInstalacao.estado || '—'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {neoInstalacao.cidade}, {neoInstalacao.estado}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Col 5: Terceirização placeholder */}
              <div />

              {/* Col 6: Valor Total */}
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[9px] text-muted-foreground font-medium cursor-help">
                      {neoInstalacao.valor_total ? formatCurrency(neoInstalacao.valor_total).replace('R$\u00a0', '') : '—'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Valor Total: {formatCurrency(neoInstalacao.valor_total || 0)}</p></TooltipContent>
                </Tooltip>
              </div>

              {/* Col 7: Valor a Receber */}
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-[9px] font-medium cursor-help ${neoInstalacao.valor_a_receber ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                      {neoInstalacao.valor_a_receber ? formatCurrency(neoInstalacao.valor_a_receber).replace('R$\u00a0', '') : '—'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">A Receber: {formatCurrency(neoInstalacao.valor_a_receber || 0)}</p></TooltipContent>
                </Tooltip>
              </div>

              {/* Col 8: Data de Agendamento */}
              <div className="text-center">
                {neoInstalacao.data_instalacao ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center leading-tight cursor-help">
                        <span className={`text-[9px] font-medium ${atrasado ? 'text-red-500' : 'text-blue-400'}`}>
                          {atrasado ? 'Atrasado' : 'Agendado'}
                        </span>
                        <span className={`text-xs font-bold ${atrasado ? 'text-red-500' : 'text-blue-400'}`}>
                          {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yy")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {neoInstalacao.vezes_agendado >= 2 && (
                      <TooltipContent>
                        <p className="text-xs">Reagendado {neoInstalacao.vezes_agendado} vezes</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ) : (
                  <span className="text-[10px] font-bold text-destructive">
                    Não agendado
                  </span>
                )}
              </div>

              {/* Col 9: Responsável/Equipe */}
              <div className="text-center overflow-hidden">
                {neoInstalacao.equipe_nome ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span 
                        className="text-[10px] font-medium truncate block cursor-help"
                        style={{ color: corEquipe }}
                      >
                        {neoInstalacao.equipe_nome.length > 10 
                          ? `${neoInstalacao.equipe_nome.substring(0, 10)}...` 
                          : neoInstalacao.equipe_nome}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{neoInstalacao.equipe_nome}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-[9px] text-muted-foreground/50">—</span>
                )}
              </div>

              {/* Col 10: Portas P/G - Badge Avulso */}
              <div className="flex items-center gap-0.5 overflow-hidden">
                <Badge 
                  variant="outline" 
                  className="text-[9px] px-1 py-0 h-4 text-blue-400 bg-blue-500/20 border-blue-500/50"
                >
                  AVULSO
                </Badge>
              </div>

              {/* Col 11: Tags/Badges (Instalação) */}
              <div className="flex items-center justify-center gap-1">
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 bg-blue-500/10 text-blue-400 border-blue-500/50">
                  <Hammer className="h-2.5 w-2.5" />
                </Badge>
              </div>

              {/* Col 12: Cores placeholder */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground/50">—</span>
              </div>

              {/* Col 13-17: Status das Ordens - placeholders */}
              <div className="flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground/50">—</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground/50">—</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground/50">—</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground/50">—</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[9px] text-muted-foreground/50">—</span>
              </div>

              {/* Col 18: Data criação + Cronômetro */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center gap-1 cursor-help">
                    <span className="text-[9px] text-muted-foreground leading-none">
                      {format(new Date(neoInstalacao.created_at), "dd/MM/yy")}
                    </span>
                    <CronometroEtapaBadge dataEntrada={neoInstalacao.created_at} compact />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Criado em: {format(new Date(neoInstalacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  {neoInstalacao.hora && (
                    <p className="text-[10px] text-muted-foreground">Hora agendada: {neoInstalacao.hora.substring(0, 5)}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Col 19: Botões de ação ou status concluído */}
              <div className="flex items-center justify-end gap-1">
                {showConcluido ? (
                  <>
                    {neoInstalacao.concluida_em && (
                      <span className="text-[10px] text-emerald-400">
                        {(() => {
                          const date = new Date(neoInstalacao.concluida_em);
                          const now = new Date();
                          const diffMs = now.getTime() - date.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffDays = Math.floor(diffMs / 86400000);
                          if (diffMins < 60) return `há ${diffMins}min`;
                          if (diffHours < 24) return `há ${diffHours}h`;
                          return `há ${diffDays}d`;
                        })()}
                      </span>
                    )}
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {onRetornar && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex h-[20px] w-[20px] rounded-[3px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetornar(neoInstalacao.id);
                        }}
                        title="Retornar para instalações"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                ) : onConcluir && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="flex h-[20px] w-[20px] rounded-[3px] bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConcluir(neoInstalacao.id);
                    }}
                    disabled={isConcluindo}
                    title="Concluir instalação"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // View mode: grid
  return (
    <Card className="p-4 border-l-4 h-full flex flex-col" style={{ borderLeftColor: corEquipe }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge 
          variant="outline" 
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Hammer className="h-3 w-3 mr-1" />
          Avulso
        </Badge>
        <Badge 
          variant="secondary" 
          style={{ 
            backgroundColor: `${corEquipe}20`,
            color: corEquipe,
          }}
        >
          {neoInstalacao.equipe_nome || "Sem equipe"}
        </Badge>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{neoInstalacao.nome_cliente}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{neoInstalacao.cidade}/{neoInstalacao.estado}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {neoInstalacao.data_instalacao && (
            <div className={`flex items-center gap-1 ${atrasado ? 'text-red-500' : ''}`}>
              <Calendar className="h-4 w-4" />
              <span>
                {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
          {neoInstalacao.hora && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{neoInstalacao.hora.substring(0, 5)}</span>
            </div>
          )}
        </div>

        {(neoInstalacao.valor_total > 0 || neoInstalacao.valor_a_receber > 0) && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            {neoInstalacao.valor_total > 0 && (
              <span className="text-muted-foreground">Total: {formatCurrency(neoInstalacao.valor_total)}</span>
            )}
            {neoInstalacao.valor_a_receber > 0 && (
              <span className="text-emerald-500">A receber: {formatCurrency(neoInstalacao.valor_a_receber)}</span>
            )}
          </div>
        )}

        {neoInstalacao.descricao && (
          <div className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
            {neoInstalacao.descricao}
          </div>
        )}
      </div>

      {onConcluir && (
        <div className="mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onConcluir(neoInstalacao.id)}
            disabled={isConcluindo}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluir Instalação
          </Button>
        </div>
      )}
    </Card>
  );
}
