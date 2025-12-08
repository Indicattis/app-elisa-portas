import { useState } from "react";
import { useInstalacoesListagem } from "@/hooks/useInstalacoesListagem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MapPin, Calendar, User, Clock, Trash2, Plus, RefreshCw } from "lucide-react";
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
import { CriarInstalacaoModal } from "@/components/instalacoes/CriarInstalacaoModal";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const { instalacoes, isLoading, concluirInstalacao, deleteInstalacao, isConcluindo, isDeleting } = useInstalacoesListagem();
  const [filter, setFilter] = useState<FilterType>("pendentes");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando instalações...</p>
      </div>
    );
  }

  const pendentesCount = instalacoes.filter((i) => !i.instalacao_concluida).length;
  const concluidasCount = instalacoes.filter((i) => i.instalacao_concluida).length;

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Controle de Instalações</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Instalação
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={filter === "pendentes" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pendentes")}
          >
            Pendentes ({pendentesCount})
          </Button>
          <Button
            variant={filter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("todos")}
          >
            Todos ({instalacoes.length})
          </Button>
          <Button
            variant={filter === "concluidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("concluidas")}
          >
            Concluídas ({concluidasCount})
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
              <TableHead>Data Instalação</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstalacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma instalação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredInstalacoes.map((inst) => (
                <TableRow key={inst.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{inst.nome_cliente}</span>
                      {inst.venda && (
                        <span className="text-xs text-muted-foreground">
                          Venda vinculada
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {inst.venda?.cidade && inst.venda?.estado
                          ? `${inst.venda.cidade}/${inst.venda.estado}`
                          : "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{formatDate(inst.data_instalacao)}</span>
                    </div>
                    {inst.hora && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{inst.hora.slice(0, 5)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {inst.equipe ? (
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: inst.equipe.cor || undefined,
                          color: inst.equipe.cor || undefined
                        }}
                      >
                        <User className="h-3 w-3 mr-1" />
                        {inst.equipe.nome}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {inst.instalacao_concluida ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!inst.instalacao_concluida && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleConcluir(inst.id)}
                          disabled={isConcluindo}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(inst.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Nova Instalação */}
      <CriarInstalacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
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
