import { useState } from "react";
import { Video, Plus, Pencil, Trash2, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostagemForm } from "@/components/postagens/PostagemForm";
import {
  usePostagens,
  useCreatePostagem,
  useUpdatePostagem,
  useDeletePostagem,
  Postagem,
} from "@/hooks/usePostagens";

export default function Postagens() {
  const anoAtual = new Date().getFullYear();
  const [anoFiltro, setAnoFiltro] = useState(anoAtual);
  const [plataformaFiltro, setPlataformaFiltro] = useState<string>("todas");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [postagemEditando, setPostagemEditando] = useState<Postagem | null>(null);
  const [deleteDialogAberto, setDeleteDialogAberto] = useState(false);
  const [postagemDeletar, setPostagemDeletar] = useState<string | null>(null);

  const { data: postagens = [], isLoading } = usePostagens(anoFiltro);
  const createMutation = useCreatePostagem();
  const updateMutation = useUpdatePostagem();
  const deleteMutation = useDeletePostagem();

  const postagensFiltradas = postagens.filter((post) => {
    if (plataformaFiltro !== "todas" && post.plataforma !== plataformaFiltro) {
      return false;
    }
    if (statusFiltro === "agendadas" && (!post.agendada || post.postada)) {
      return false;
    }
    if (statusFiltro === "postadas" && !post.postada) {
      return false;
    }
    return true;
  });

  const handleNovaPostagem = () => {
    setPostagemEditando(null);
    setModalAberto(true);
  };

  const handleEditarPostagem = (postagem: Postagem) => {
    setPostagemEditando(postagem);
    setModalAberto(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (postagemEditando) {
        await updateMutation.mutateAsync({ id: postagemEditando.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setModalAberto(false);
      setPostagemEditando(null);
    } catch (error) {
      console.error("Erro ao salvar postagem:", error);
    }
  };

  const handleDeletarPostagem = (id: string) => {
    setPostagemDeletar(id);
    setDeleteDialogAberto(true);
  };

  const confirmarDelecao = async () => {
    if (postagemDeletar) {
      await deleteMutation.mutateAsync(postagemDeletar);
      setDeleteDialogAberto(false);
      setPostagemDeletar(null);
    }
  };

  const getStatusBadge = (postagem: Postagem) => {
    if (postagem.agendada && !postagem.postada) {
      return (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300 bg-orange-50">
          <Clock className="h-3 w-3" />
          Agendada
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
        <CheckCircle2 className="h-3 w-3" />
        Postada
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
            <Video className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
              Postagens
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gerencie as postagens nas redes sociais
            </p>
          </div>
        </div>
        <Button onClick={handleNovaPostagem} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Postagem
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label>Ano</Label>
            <Select
              value={String(anoFiltro)}
              onValueChange={(value) => setAnoFiltro(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => anoAtual - i).map((ano) => (
                  <SelectItem key={ano} value={String(ano)}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Plataforma</Label>
            <Select value={plataformaFiltro} onValueChange={setPlataformaFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Status</Label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="postadas">Postadas</SelectItem>
                <SelectItem value="agendadas">Agendadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Curtidas</TableHead>
                <TableHead className="text-right">Visualizações</TableHead>
                <TableHead className="text-right">Comentários</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : postagensFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhuma postagem encontrada
                  </TableCell>
                </TableRow>
              ) : (
                postagensFiltradas.map((postagem) => (
                  <TableRow key={postagem.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {postagem.titulo}
                    </TableCell>
                    <TableCell>
                      {new Date(postagem.data_postagem + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {postagem.hora_agendamento 
                        ? postagem.hora_agendamento.slice(0, 5) 
                        : "-"}
                    </TableCell>
                    <TableCell className="capitalize">{postagem.plataforma}</TableCell>
                    <TableCell>{getStatusBadge(postagem)}</TableCell>
                    <TableCell className="text-right">{postagem.curtidas}</TableCell>
                    <TableCell className="text-right">{postagem.visualizacoes}</TableCell>
                    <TableCell className="text-right">{postagem.comentarios}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {postagem.link_post && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={postagem.link_post}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarPostagem(postagem)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletarPostagem(postagem.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de criação/edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {postagemEditando ? "Editar Postagem" : "Nova Postagem"}
            </DialogTitle>
          </DialogHeader>
          <PostagemForm
            postagem={postagemEditando || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalAberto(false);
              setPostagemEditando(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogAberto} onOpenChange={setDeleteDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDelecao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
