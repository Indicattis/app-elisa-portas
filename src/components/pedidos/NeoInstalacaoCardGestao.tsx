import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  UserCircle,
  FileText
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NeoInstalacao } from "@/types/neoInstalacao";

interface NeoInstalacaoCardGestaoProps {
  neoInstalacao: NeoInstalacao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
}

export function NeoInstalacaoCardGestao({
  neoInstalacao,
  viewMode = 'grid',
  onConcluir,
  isConcluindo,
}: NeoInstalacaoCardGestaoProps) {
  const corEquipe = neoInstalacao.equipe?.cor || "#6366f1";

  if (viewMode === 'list') {
    return (
      <Card className="p-3 border-l-4" style={{ borderLeftColor: corEquipe }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Badge Avulso */}
            <Badge 
              variant="outline" 
              className="shrink-0 bg-purple-50 text-purple-700 border-purple-200"
            >
              Avulso
            </Badge>

            {/* Cliente */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{neoInstalacao.nome_cliente}</span>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
              <MapPin className="h-4 w-4" />
              <span>{neoInstalacao.cidade}/{neoInstalacao.estado}</span>
            </div>

            {/* Data */}
            {neoInstalacao.data_instalacao && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(parseISO(neoInstalacao.data_instalacao), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            )}

            {/* Hora */}
            {neoInstalacao.hora && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                <Clock className="h-4 w-4" />
                <span>{neoInstalacao.hora.substring(0, 5)}</span>
              </div>
            )}

            {/* Equipe */}
            <Badge 
              variant="secondary" 
              className="shrink-0"
              style={{ 
                backgroundColor: `${corEquipe}20`,
                color: corEquipe,
              }}
            >
              {neoInstalacao.equipe_nome || "Sem equipe"}
            </Badge>
          </div>

          {/* Ação */}
          {onConcluir && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
              onClick={() => onConcluir(neoInstalacao.id)}
              disabled={isConcluindo}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Concluir
            </Button>
          )}
        </div>

        {/* Descrição se houver */}
        {neoInstalacao.descricao && (
          <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{neoInstalacao.descricao}</span>
          </div>
        )}
      </Card>
    );
  }

  // View mode: grid
  return (
    <Card className="p-4 border-l-4 h-full flex flex-col" style={{ borderLeftColor: corEquipe }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge 
          variant="outline" 
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
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
        {/* Cliente */}
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium truncate">{neoInstalacao.nome_cliente}</span>
        </div>

        {/* Localização */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{neoInstalacao.cidade}/{neoInstalacao.estado}</span>
        </div>

        {/* Data e Hora */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {neoInstalacao.data_instalacao && (
            <div className="flex items-center gap-1">
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

        {/* Descrição */}
        {neoInstalacao.descricao && (
          <div className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
            {neoInstalacao.descricao}
          </div>
        )}
      </div>

      {/* Ação */}
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
