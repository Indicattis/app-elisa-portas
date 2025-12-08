import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInstalacoesListagem } from "@/hooks/useInstalacoesListagem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MapPin, Calendar, Clock, Trash2, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { FiltrosInstalacoes } from "@/components/instalacoes/FiltrosInstalacoes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FilterType = "pendentes" | "todos" | "concluidas";

export default function InstalacoesControle() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { instalacoes: instalacoesBrutas, isLoading, concluirInstalacao, deleteInstalacao, isConcluindo, isDeleting } = useInstalacoesListagem();
  const [filter, setFilter] = useState<FilterType>("pendentes");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Filtros
  const [filtroEquipeId, setFiltroEquipeId] = useState("all");
  const [filtroTipoInstalacao, setFiltroTipoInstalacao] = useState("all");

  // Aplicar filtros
  const instalacoes = useMemo(() => {
    return instalacoesBrutas.filter((inst) => {
      // Filtro de equipe
      if (filtroEquipeId !== "all") {
        if (filtroEquipeId === "sem_equipe") {
          if (inst.responsavel_instalacao_id) return false;
        } else {
          if (inst.responsavel_instalacao_id !== filtroEquipeId) return false;
        }
      }

      // Filtro de tipo de instalação
      if (filtroTipoInstalacao !== "all") {
        if (inst.tipo_instalacao !== filtroTipoInstalacao) return false;
      }

      return true;
    });
  }, [instalacoesBrutas, filtroEquipeId, filtroTipoInstalacao]);

  const filteredInstalacoes = instalacoes.filter((inst) => {
    if (filter === "pendentes") {
      return !inst.instalacao_concluida;
    } else if (filter === "concluidas") {
      return inst.instalacao_concluida;
    }
    return true;
  });

  const handleConcluir = async (id: string) => {
    if (window.confirm("Confirma a conclusão desta instalação?")) {
      await concluirInstalacao(id);
    }
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteInstalacao(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedId(id);
    setDeleteDialogOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["instalacoes_listagem"] });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM", { locale: ptBR });
  };

  const pendentesCount = instalacoes.filter((i) => !i.instalacao_concluida).length;
  const concluidasCount = instalacoes.filter((i) => i.instalacao_concluida).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando instalações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Header com ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">Controle</h2>
          
          {/* Filtros */}
          <FiltrosInstalacoes
            equipeId={filtroEquipeId}
            tipoInstalacao={filtroTipoInstalacao}
            onEquipeChange={setFiltroEquipeId}
            onTipoInstalacaoChange={setFiltroTipoInstalacao}
          />
        </div>
        
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => navigate('/instalacoes/nova')} className="h-8 px-2">
            <Plus className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Nova</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros - scroll horizontal se necessário */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Button
          variant={filter === "pendentes" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pendentes")}
          className="h-8 text-xs shrink-0"
        >
          Pendentes ({pendentesCount})
        </Button>
        <Button
          variant={filter === "todos" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("todos")}
          className="h-8 text-xs shrink-0"
        >
          Todos ({instalacoes.length})
        </Button>
        <Button
          variant={filter === "concluidas" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("concluidas")}
          className="h-8 text-xs shrink-0"
        >
          Concluídas ({concluidasCount})
        </Button>
      </div>

      {/* Tabela de Instalações */}
      <Card className="overflow-hidden">
        {filteredInstalacoes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma instalação encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-[25px]">
                  <TableHead className="h-[25px] py-0 text-xs">Status</TableHead>
                  <TableHead className="h-[25px] py-0 text-xs">Cliente</TableHead>
                  <TableHead className="h-[25px] py-0 text-xs">Equipe</TableHead>
                  <TableHead className="h-[25px] py-0 text-xs">Data</TableHead>
                  <TableHead className="h-[25px] py-0 text-xs">Hora</TableHead>
                  <TableHead className="h-[25px] py-0 text-xs">Local</TableHead>
                  <TableHead className="h-[25px] py-0 text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstalacoes.map((inst) => (
                  <TableRow key={inst.id} className="h-[25px]">
                    <TableCell className="h-[25px] py-0">
                      {inst.instalacao_concluida ? (
                        <Badge variant="default" className="bg-green-500 text-[10px] h-5 px-1">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          OK
                        </Badge>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </TableCell>
                    <TableCell className="h-[25px] py-0 text-xs font-medium max-w-[150px] truncate">
                      {inst.nome_cliente}
                    </TableCell>
                    <TableCell className="h-[25px] py-0">
                      {inst.equipe && (
                        <div className="flex items-center gap-1">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: inst.equipe.cor || '#888' }}
                          />
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {inst.equipe.nome}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="h-[25px] py-0 text-xs text-muted-foreground">
                      {formatDate(inst.data_instalacao)}
                    </TableCell>
                    <TableCell className="h-[25px] py-0 text-xs text-muted-foreground">
                      {inst.hora?.slice(0, 5) || "-"}
                    </TableCell>
                    <TableCell className="h-[25px] py-0 text-xs text-muted-foreground max-w-[100px] truncate">
                      {inst.venda?.cidade ? `${inst.venda.cidade}${inst.venda.estado ? `/${inst.venda.estado}` : ''}` : '-'}
                    </TableCell>
                    <TableCell className="h-[25px] py-0 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!inst.instalacao_concluida && (
                          <Button
                            size="sm"
                            onClick={() => handleConcluir(inst.id)}
                            disabled={isConcluindo}
                            className="h-5 text-[10px] px-1.5"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />
                            Concluir
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(inst.id)}
                          disabled={isDeleting}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Instalação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta instalação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
