import { useState } from "react";
import { useHistoricoOrdens } from "@/hooks/useHistoricoOrdens";
import { HistoricoFiltros } from "@/components/production/HistoricoFiltros";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/utils/timeFormat";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History } from "lucide-react";

const TIPO_ORDEM_COLORS: Record<string, string> = {
  soldagem: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  perfiladeira: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  separacao: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  qualidade: "bg-green-500/10 text-green-700 border-green-500/20",
  pintura: "bg-pink-500/10 text-pink-700 border-pink-500/20",
};

const TIPO_ORDEM_LABELS: Record<string, string> = {
  soldagem: "Soldagem",
  perfiladeira: "Perfiladeira",
  separacao: "Separação",
  qualidade: "Qualidade",
  pintura: "Pintura",
};

export default function HistoricoProducao() {
  const [tipoOrdem, setTipoOrdem] = useState("todos");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [busca, setBusca] = useState("");

  const { data: ordens = [], isLoading } = useHistoricoOrdens({
    tipoOrdem: tipoOrdem as any,
    dataInicio,
    dataFim,
    busca,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Histórico de Produção</h1>
          <p className="text-muted-foreground">Todas as ordens de produção concluídas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoricoFiltros
            tipoOrdem={tipoOrdem}
            setTipoOrdem={setTipoOrdem}
            dataInicio={dataInicio}
            setDataInicio={setDataInicio}
            dataFim={dataFim}
            setDataFim={setDataFim}
            busca={busca}
            setBusca={setBusca}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              `${ordens.length} ordem${ordens.length !== 1 ? 's' : ''} encontrada${ordens.length !== 1 ? 's' : ''}`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ordens.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ordem encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Ordem</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data Conclusão</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordens.map((ordem) => (
                    <TableRow key={`${ordem.tipo_ordem}-${ordem.id}`}>
                      <TableCell className="font-medium">{ordem.numero_ordem}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TIPO_ORDEM_COLORS[ordem.tipo_ordem]}>
                          {TIPO_ORDEM_LABELS[ordem.tipo_ordem]}
                        </Badge>
                      </TableCell>
                      <TableCell>{ordem.pedido?.numero_pedido || "-"}</TableCell>
                      <TableCell>{ordem.pedido?.cliente_nome || "-"}</TableCell>
                      <TableCell>
                        {ordem.admin_users ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ordem.admin_users.foto_perfil_url} />
                              <AvatarFallback className="text-xs">
                                {ordem.admin_users.nome.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ordem.admin_users.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem responsável</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ordem.data_conclusao
                          ? format(new Date(ordem.data_conclusao), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {ordem.tempo_conclusao_segundos
                          ? formatDuration(ordem.tempo_conclusao_segundos)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                          Concluído
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
