import { useState } from "react";
import { useOrdensInstalacaoListagem } from "@/hooks/useOrdensInstalacaoListagem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MapPin, Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FilterType = "pendentes" | "todos" | "concluidas";

export default function InstalacoesControle() {
  const { ordens, isLoading, concluirInstalacao, isConcluindo } = useOrdensInstalacaoListagem();
  const [filter, setFilter] = useState<FilterType>("pendentes");

  const filteredOrdens = ordens.filter((ordem: any) => {
    const instalacao = ordem.pedido?.instalacao?.[0];
    
    if (filter === "pendentes") {
      return !instalacao?.instalacao_concluida;
    } else if (filter === "concluidas") {
      return instalacao?.instalacao_concluida;
    }
    return true;
  });

  const handleConcluir = async (pedidoId: string) => {
    if (window.confirm("Confirma a conclusão desta instalação?")) {
      await concluirInstalacao(pedidoId);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando instalações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={filter === "pendentes" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pendentes")}
          >
            Pendentes ({ordens.filter((o: any) => !o.pedido?.instalacao?.[0]?.instalacao_concluida).length})
          </Button>
          <Button
            variant={filter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("todos")}
          >
            Todos ({ordens.length})
          </Button>
          <Button
            variant={filter === "concluidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("concluidas")}
          >
            Concluídas ({ordens.filter((o: any) => o.pedido?.instalacao?.[0]?.instalacao_concluida).length})
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Data Carregamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrdens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma instalação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredOrdens.map((ordem: any) => {
                const instalacao = ordem.pedido?.instalacao?.[0];
                const concluida = instalacao?.instalacao_concluida;

                return (
                  <TableRow key={ordem.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{ordem.venda?.cliente_nome || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          Pedido #{ordem.pedido?.numero_pedido}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {ordem.venda?.cliente_cidade}/{ordem.venda?.cliente_estado}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(ordem.data_carregamento)}</span>
                      </div>
                      {ordem.hora_carregamento && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{ordem.hora_carregamento}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{ordem.responsavel_carregamento_nome || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {concluida ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluída
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!concluida && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleConcluir(ordem.pedido?.id)}
                          disabled={isConcluindo}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
