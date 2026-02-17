import { NeoCorrecao } from "@/types/neoCorrecao";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CronometroEtapaBadge } from "./CronometroEtapaBadge";
import { MapPin, Calendar, CalendarPlus, Clock, AlertTriangle, Check, DollarSign, Undo2, GripVertical, Archive } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoCorrecaoCardGestaoProps {
  neoCorrecao: NeoCorrecao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
  showConcluido?: boolean;
  onRetornar?: (id: string) => void;
  onAgendar?: (id: string) => void;
  onArquivar?: (id: string) => void;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
}

export function NeoCorrecaoCardGestao({
  neoCorrecao,
  viewMode = 'grid',
  onConcluir,
  isConcluindo,
  showConcluido = false,
  onRetornar,
  onAgendar,
  onArquivar,
  dragHandleProps,
  isDragging,
}: NeoCorrecaoCardGestaoProps) {
  const corEquipe = neoCorrecao.equipe?.cor || "#9333ea";

  // Dados do criador
  const criadorNome = neoCorrecao.criador?.nome || 'Desconhecido';
  const criadorFoto = neoCorrecao.criador?.foto_perfil_url;
  const criadorIniciais = criadorNome
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const atrasado = (() => {
    const dataStr = neoCorrecao.data_correcao;
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
                    <AvatarFallback className="text-[8px] bg-purple-500/20 text-purple-400 border border-purple-500/50">
                      {criadorIniciais}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Criado por: {criadorNome}</p>
                  <p className="text-[10px] text-muted-foreground">Correção Avulsa</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Col 3: Nome do cliente */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-sm truncate">
                    {neoCorrecao.nome_cliente && neoCorrecao.nome_cliente.length > 20 
                      ? `${neoCorrecao.nome_cliente.substring(0, 20)}...` 
                      : neoCorrecao.nome_cliente}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{neoCorrecao.nome_cliente}</p>
                  {neoCorrecao.descricao && (
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[250px]">{neoCorrecao.descricao}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Col 4: Cidade/Estado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center text-center">
                    <span className="text-[10px] text-muted-foreground truncate">
                      {neoCorrecao.cidade && neoCorrecao.estado 
                        ? `${neoCorrecao.cidade}/${neoCorrecao.estado}`
                        : neoCorrecao.cidade || neoCorrecao.estado || '—'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {neoCorrecao.cidade}, {neoCorrecao.estado}
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
                      {neoCorrecao.valor_total ? formatCurrency(neoCorrecao.valor_total).replace('R$\u00a0', '') : '—'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Valor Total: {formatCurrency(neoCorrecao.valor_total || 0)}</p></TooltipContent>
                </Tooltip>
              </div>

              {/* Col 7: Valor a Receber */}
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-[9px] font-medium cursor-help ${neoCorrecao.valor_a_receber ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                      {neoCorrecao.valor_a_receber ? formatCurrency(neoCorrecao.valor_a_receber).replace('R$\u00a0', '') : '—'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">A Receber: {formatCurrency(neoCorrecao.valor_a_receber || 0)}</p></TooltipContent>
                </Tooltip>
              </div>

              {/* Col 8: Data de Agendamento */}
              <div className="text-center">
                {neoCorrecao.data_correcao ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center leading-tight cursor-help">
                        <span className={`text-[9px] font-medium ${atrasado ? 'text-red-500' : 'text-purple-400'}`}>
                          {atrasado ? 'Atrasado' : 'Agendado'}
                        </span>
                        <span className={`text-xs font-bold ${atrasado ? 'text-red-500' : 'text-purple-400'}`}>
                          {format(parseISO(neoCorrecao.data_correcao), "dd/MM/yy")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {neoCorrecao.vezes_agendado >= 2 && (
                      <TooltipContent>
                        <p className="text-xs">Reagendado {neoCorrecao.vezes_agendado} vezes</p>
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
                {neoCorrecao.equipe_nome ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span 
                        className="text-[10px] font-medium truncate block cursor-help"
                        style={{ color: corEquipe }}
                      >
                        {neoCorrecao.equipe_nome.length > 10 
                          ? `${neoCorrecao.equipe_nome.substring(0, 10)}...` 
                          : neoCorrecao.equipe_nome}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{neoCorrecao.equipe_nome}</p>
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
                  className="text-[9px] px-1 py-0 h-4 text-purple-400 bg-purple-500/20 border-purple-500/50"
                >
                  AVULSO
                </Badge>
              </div>

              {/* Col 11: Tags/Badges (Correção) */}
              <div className="flex items-center justify-center gap-1">
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 bg-purple-500/10 text-purple-400 border-purple-500/50">
                  <AlertTriangle className="h-2.5 w-2.5" />
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
                      {format(new Date(neoCorrecao.created_at), "dd/MM/yy")}
                    </span>
                    <CronometroEtapaBadge dataEntrada={neoCorrecao.created_at} compact />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Criado em: {format(new Date(neoCorrecao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  {neoCorrecao.hora && (
                    <p className="text-[10px] text-muted-foreground">Hora agendada: {neoCorrecao.hora.slice(0, 5)}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Col 19: Botões de ação ou status concluído */}
              <div className="flex items-center justify-end gap-1" style={{ gridColumn: '19 / -1' }}>
                {onAgendar && !showConcluido && !neoCorrecao.data_correcao && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="flex h-[20px] w-[20px] rounded-[3px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgendar(neoCorrecao.id);
                    }}
                    title="Agendar no calendário"
                  >
                    <CalendarPlus className="h-3 w-3" />
                  </Button>
                )}
                {showConcluido ? (
                  <>
                    {neoCorrecao.concluida_em && (
                      <span className="text-[10px] text-emerald-400">
                        {(() => {
                          const date = new Date(neoCorrecao.concluida_em);
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
                    <Check className="h-4 w-4 text-emerald-500" />
                    {onRetornar && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex h-[20px] w-[20px] rounded-[3px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetornar(neoCorrecao.id);
                        }}
                        title="Retornar para correções"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                    {onArquivar && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex h-[20px] w-[20px] rounded-[3px] bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArquivar(neoCorrecao.id);
                        }}
                        title="Arquivar"
                      >
                        <Archive className="h-3 w-3" />
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
                      onConcluir(neoCorrecao.id);
                    }}
                    disabled={isConcluindo}
                    title="Concluir correção"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Grid mode
  return (
    <Card className="h-full border-l-4 p-4" style={{ borderLeftColor: "#9333ea" }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-purple-600" />
        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
          Correção Avulsa
        </Badge>
      </div>

      <h4 className="font-medium text-sm mb-2">
        {neoCorrecao.nome_cliente}
      </h4>

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {neoCorrecao.cidade}/{neoCorrecao.estado}
        </div>

        {neoCorrecao.data_correcao && (
          <div className={`flex items-center gap-1 ${atrasado ? 'text-red-500' : ''}`}>
            <Calendar className="h-3 w-3" />
            {format(parseISO(neoCorrecao.data_correcao), "dd/MM/yyyy", { locale: ptBR })}
            {neoCorrecao.hora && ` às ${neoCorrecao.hora.slice(0, 5)}`}
          </div>
        )}

        {neoCorrecao.equipe_nome && (
          <Badge
            variant="outline"
            className="text-[10px]"
            style={{
              backgroundColor: `${corEquipe}15`,
              borderColor: `${corEquipe}40`,
              color: corEquipe
            }}
          >
            {neoCorrecao.equipe_nome}
          </Badge>
        )}

        {neoCorrecao.descricao && (
          <p className="text-muted-foreground italic line-clamp-2">
            {neoCorrecao.descricao}
          </p>
        )}

        {(neoCorrecao.valor_total > 0 || neoCorrecao.valor_a_receber > 0) && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            {neoCorrecao.valor_total > 0 && (
              <span className="text-muted-foreground">Total: {formatCurrency(neoCorrecao.valor_total)}</span>
            )}
            {neoCorrecao.valor_a_receber > 0 && (
              <span className="text-emerald-500">A receber: {formatCurrency(neoCorrecao.valor_a_receber)}</span>
            )}
          </div>
        )}
      </div>

      {onConcluir && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onConcluir(neoCorrecao.id)}
          disabled={isConcluindo}
        >
          <Check className="h-4 w-4 mr-1" />
          Concluir Correção
        </Button>
      )}
    </Card>
  );
}
