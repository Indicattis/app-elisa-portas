import { NeoInstalacao } from "@/types/neoInstalacao";
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
  User, 
  FileText,
  CheckCircle,
  Users
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoInstalacaoDetailsProps {
  neoInstalacao: NeoInstalacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
}

export function NeoInstalacaoDetails({
  neoInstalacao,
  open,
  onOpenChange,
  onConcluir,
  isConcluindo,
}: NeoInstalacaoDetailsProps) {
  if (!neoInstalacao) return null;

  const corEquipe = neoInstalacao.equipe?.cor || "#6366f1";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/50">
              Instalação Avulsa
            </Badge>
            <Badge
              variant="outline"
              style={{
                backgroundColor: `${corEquipe}20`,
                color: corEquipe,
                borderColor: `${corEquipe}50`,
              }}
            >
              {neoInstalacao.equipe_nome || "Sem equipe"}
            </Badge>
          </div>
          <SheetTitle className="text-left text-lg">
            {neoInstalacao.nome_cliente}
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
              {neoInstalacao.cidade}/{neoInstalacao.estado}
            </p>
          </div>

          <Separator />

          {/* Data e Hora */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Data da Instalação
            </h4>
            <div className="pl-6 space-y-1">
              {neoInstalacao.data_instalacao ? (
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(neoInstalacao.data_instalacao), "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Não agendada</p>
              )}
              {neoInstalacao.hora && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {neoInstalacao.hora.substring(0, 5)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Equipe */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Equipe Responsável
            </h4>
            <div className="pl-6">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${corEquipe}20`,
                  color: corEquipe,
                  borderColor: `${corEquipe}50`,
                }}
              >
                {neoInstalacao.equipe_nome || "Sem equipe atribuída"}
              </Badge>
            </div>
          </div>

          {/* Descrição */}
          {neoInstalacao.descricao && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descrição / Observações
                </h4>
                <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                  {neoInstalacao.descricao}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadados */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              Criado em:{" "}
              {format(parseISO(neoInstalacao.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
            {neoInstalacao.updated_at !== neoInstalacao.created_at && (
              <p>
                Última atualização:{" "}
                {format(parseISO(neoInstalacao.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>

          {/* Ação de Concluir */}
          {onConcluir && !neoInstalacao.concluida && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onConcluir(neoInstalacao.id)}
              disabled={isConcluindo}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isConcluindo ? "Concluindo..." : "Concluir Instalação"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
