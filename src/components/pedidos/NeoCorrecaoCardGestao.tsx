import { NeoCorrecao } from "@/types/neoCorrecao";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, AlertTriangle, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NeoCorrecaoCardGestaoProps {
  neoCorrecao: NeoCorrecao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
}

export function NeoCorrecaoCardGestao({
  neoCorrecao,
  viewMode = 'grid',
  onConcluir,
  isConcluindo
}: NeoCorrecaoCardGestaoProps) {
  const corEquipe = neoCorrecao.equipe?.cor || "#9333ea";

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return null;
    try {
      return format(parseISO(dataStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dataStr;
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="border-l-4" style={{ borderLeftColor: "#9333ea" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                  Correção Avulsa
                </Badge>
                {neoCorrecao.equipe_nome && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${corEquipe}15`,
                      borderColor: `${corEquipe}40`,
                      color: corEquipe
                    }}
                  >
                    {neoCorrecao.equipe_nome}
                  </Badge>
                )}
              </div>

              <h4 className="font-medium text-sm truncate">
                {neoCorrecao.nome_cliente}
              </h4>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {neoCorrecao.cidade}/{neoCorrecao.estado}
                </span>
                {neoCorrecao.data_correcao && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatarData(neoCorrecao.data_correcao)}
                  </span>
                )}
                {neoCorrecao.hora && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {neoCorrecao.hora.slice(0, 5)}
                  </span>
                )}
              </div>

              {neoCorrecao.descricao && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                  {neoCorrecao.descricao}
                </p>
              )}
            </div>

            {onConcluir && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConcluir(neoCorrecao.id)}
                disabled={isConcluindo}
                className="flex-shrink-0"
              >
                <Check className="h-4 w-4 mr-1" />
                Concluir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid mode
  return (
    <Card className="h-full border-l-4" style={{ borderLeftColor: "#9333ea" }}>
      <CardContent className="p-4">
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
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatarData(neoCorrecao.data_correcao)}
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
      </CardContent>
    </Card>
  );
}
