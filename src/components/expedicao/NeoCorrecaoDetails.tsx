import { NeoCorrecao } from "@/types/neoCorrecao";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle,
  Users,
  AlertTriangle,
  Building2,
  Pencil,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoCorrecaoDetailsProps {
  neoCorrecao: NeoCorrecao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluir?: (id: string) => void;
  onEditar?: (neoCorrecao: NeoCorrecao) => void;
  isConcluindo?: boolean;
}

export function NeoCorrecaoDetails({
  neoCorrecao,
  open,
  onOpenChange,
  onConcluir,
  onEditar,
  isConcluindo,
}: NeoCorrecaoDetailsProps) {
  if (!neoCorrecao) return null;

  const isAutorizado = neoCorrecao.tipo_responsavel === 'autorizado';
  const corResponsavel = isAutorizado ? '#10B981' : (neoCorrecao.equipe?.cor || "#9333ea");
  const nomeResponsavel = isAutorizado 
    ? neoCorrecao.autorizado_nome || "Sem autorizado"
    : neoCorrecao.equipe_nome || "Sem equipe";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Correção Avulsa
            </Badge>
            <Badge
              variant="outline"
              style={{
                backgroundColor: `${corResponsavel}20`,
                color: corResponsavel,
                borderColor: `${corResponsavel}50`,
              }}
            >
              {nomeResponsavel}
            </Badge>
          </div>
          <SheetTitle className="text-left text-lg">
            {neoCorrecao.nome_cliente}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Localização */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Localização
            </h4>
            <p className="text-sm text-muted-foreground pl-6">
              {neoCorrecao.cidade}/{neoCorrecao.estado}
            </p>
          </div>

          <Separator />

          {/* Data e Hora */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Data da Correção
            </h4>
            <div className="pl-6 space-y-1">
              {neoCorrecao.data_correcao ? (
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(neoCorrecao.data_correcao), "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Não agendada</p>
              )}
              {neoCorrecao.hora && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {neoCorrecao.hora.substring(0, 5)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Responsável */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              {isAutorizado ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
              {isAutorizado ? "Autorizado Responsável" : "Equipe Responsável"}
            </h4>
            <div className="pl-6">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${corResponsavel}20`,
                  color: corResponsavel,
                  borderColor: `${corResponsavel}50`,
                }}
              >
                {nomeResponsavel}
              </Badge>
            </div>
          </div>

          {/* Valores financeiros */}
          {(neoCorrecao.valor_total > 0 || neoCorrecao.valor_a_receber > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Financeiro
                </h4>
                <div className="pl-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-sm font-medium">{formatCurrency(neoCorrecao.valor_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor a Receber</p>
                    <p className="text-sm font-medium text-green-500">{formatCurrency(neoCorrecao.valor_a_receber)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Descrição */}
          {neoCorrecao.descricao && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descrição / Observações
                </h4>
                <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                  {neoCorrecao.descricao}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadados */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              Criado em:{" "}
              {format(parseISO(neoCorrecao.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
            {neoCorrecao.updated_at !== neoCorrecao.created_at && (
              <p>
                Última atualização:{" "}
                {format(parseISO(neoCorrecao.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2">
            {onEditar && !neoCorrecao.concluida && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onEditar(neoCorrecao);
                  onOpenChange(false);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onConcluir && !neoCorrecao.concluida && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => onConcluir(neoCorrecao.id)}
                disabled={isConcluindo}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isConcluindo ? "Concluindo..." : "Concluir Correção"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
