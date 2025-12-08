import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, MapPin, Phone, User, Loader2 } from "lucide-react";

interface InstalacaoDetailsSheetProps {
  instalacao: InstalacaoCalendario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConcluirInstalacao: (id: string) => Promise<void>;
  isConcluindo: boolean;
}

export const InstalacaoDetailsSheet = ({
  instalacao,
  open,
  onOpenChange,
  onConcluirInstalacao,
  isConcluindo,
}: InstalacaoDetailsSheetProps) => {
  if (!instalacao) return null;

  const handleConcluir = () => {
    onConcluirInstalacao(instalacao.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Detalhes da Instalação</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Cliente */}
          <div>
            <h3 className="font-semibold text-lg">{instalacao.nome_cliente}</h3>
            {instalacao.equipe && (
              <Badge 
                variant="outline" 
                className="mt-2"
                style={{ 
                  borderColor: instalacao.equipe.cor || undefined,
                  color: instalacao.equipe.cor || undefined
                }}
              >
                {instalacao.equipe.nome}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Data e Hora */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {instalacao.data_instalacao
                  ? format(new Date(instalacao.data_instalacao), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "Data não definida"}
              </span>
            </div>
            {instalacao.hora && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{instalacao.hora.slice(0, 5)}</span>
              </div>
            )}
          </div>

          {/* Dados da venda (se houver) */}
          {instalacao.venda && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
                {(instalacao.venda.cidade || instalacao.venda.estado) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[instalacao.venda.bairro, instalacao.venda.cidade, instalacao.venda.estado]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {instalacao.venda.cliente_telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{instalacao.venda.cliente_telefone}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Responsável */}
          {instalacao.responsavel_instalacao_nome && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{instalacao.responsavel_instalacao_nome}</span>
              </div>
            </>
          )}

          {/* Status */}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={instalacao.instalacao_concluida ? "default" : "secondary"}>
              {instalacao.instalacao_concluida ? "Concluída" : "Pendente"}
            </Badge>
          </div>

          {/* Ações */}
          {!instalacao.instalacao_concluida && (
            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={handleConcluir}
                disabled={isConcluindo}
              >
                {isConcluindo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Concluindo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Concluir Instalação
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
