import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstalacoesListagem } from "@/hooks/useInstalacoesListagem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MapPin, Calendar, User, Clock, Trash2, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { instalacoes, isLoading, concluirInstalacao, deleteInstalacao, isConcluindo, isDeleting } = useInstalacoesListagem();
  const [filter, setFilter] = useState<FilterType>("pendentes");
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold truncate">Controle</h2>
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

      {/* Lista de Instalações */}
      <div className="space-y-2">
        {filteredInstalacoes.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhuma instalação encontrada
          </Card>
        ) : (
          filteredInstalacoes.map((inst) => (
            <Card key={inst.id} className="p-3">
              <div className="flex items-start gap-3">
                {/* Indicador de status */}
                <div className={`shrink-0 w-1 h-full min-h-[60px] rounded-full ${
                  inst.instalacao_concluida ? 'bg-green-500' : 'bg-amber-500'
                }`} />

                {/* Conteúdo principal */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Nome do cliente e status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{inst.nome_cliente}</p>
                      {inst.equipe && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: inst.equipe.cor || '#888' }}
                          />
                          <span className="text-xs text-muted-foreground truncate">
                            {inst.equipe.nome}
                          </span>
                        </div>
                      )}
                    </div>
                    {inst.instalacao_concluida && (
                      <Badge variant="default" className="bg-green-500 text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </div>

                  {/* Info row - data, hora, local */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(inst.data_instalacao)}</span>
                    </div>
                    {inst.hora && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{inst.hora.slice(0, 5)}</span>
                      </div>
                    )}
                    {inst.venda?.cidade && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">
                          {inst.venda.cidade}
                          {inst.venda.estado && `/${inst.venda.estado}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-1">
                    {!inst.instalacao_concluida && (
                      <Button
                        size="sm"
                        onClick={() => handleConcluir(inst.id)}
                        disabled={isConcluindo}
                        className="h-7 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluir
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(inst.id)}
                      disabled={isDeleting}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>


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
