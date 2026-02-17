import { useState } from "react";
import { Plus, Users, Edit2, Trash2, Crown, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useEquipesMembros } from "@/hooks/useEquipesMembros";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSetoresLideres } from "@/hooks/useSetoresLideres";
import { useAllUsers } from "@/hooks/useAllUsers";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CORES_EQUIPES = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

interface Usuario {
  user_id: string;
  nome: string;
  email: string;
  id: string;
  foto_perfil_url?: string;
}

export default function EquipesDirecao() {
  const isMobile = useIsMobile();
  const { equipes, loading, createEquipe, updateEquipe, deleteEquipe } = useEquipesInstalacao();
  const { membros, adicionarMembro, removerMembro } = useEquipesMembros();
  const { lideres, isLoading: isLoadingLideres, atribuirLider, removerLider } = useSetoresLideres();
  const { data: allUsers = [] } = useAllUsers();

  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [membrosSheetOpen, setMembrosSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [equipeEditando, setEquipeEditando] = useState<any>(null);
  const [equipeParaMembros, setEquipeParaMembros] = useState<any>(null);
  const [equipeParaExcluir, setEquipeParaExcluir] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [formNome, setFormNome] = useState("");
  const [formCor, setFormCor] = useState(CORES_EQUIPES[0]);
  const [formResponsavel, setFormResponsavel] = useState("");
  const [novoMembroId, setNovoMembroId] = useState("");

  // Gerente do setor
  const gerenteAtual = lideres.find(l => l.setor === "instalacoes");

  const carregarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, id, foto_perfil_url')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const abrirFormNovo = () => {
    setEquipeEditando(null);
    setFormNome("");
    setFormCor(CORES_EQUIPES[0]);
    setFormResponsavel("");
    carregarUsuarios();
    setFormSheetOpen(true);
  };

  const abrirFormEditar = (equipe: any) => {
    setEquipeEditando(equipe);
    setFormNome(equipe.nome);
    setFormCor(equipe.cor || CORES_EQUIPES[0]);
    setFormResponsavel(equipe.responsavel_id || "");
    carregarUsuarios();
    setFormSheetOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formNome.trim()) {
      toast.error("Nome da equipe é obrigatório");
      return;
    }

    const dados = {
      nome: formNome,
      cor: formCor,
      responsavel_id: formResponsavel || null,
    };

    let sucesso = false;
    if (equipeEditando) {
      sucesso = await updateEquipe(equipeEditando.id, dados);
    } else {
      sucesso = await createEquipe(dados);
    }

    if (sucesso) {
      setFormSheetOpen(false);
    }
  };

  const abrirMembros = async (equipe: any) => {
    setEquipeParaMembros(equipe);
    setNovoMembroId("");
    await carregarUsuarios();
    setMembrosSheetOpen(true);
  };

  const handleAdicionarMembro = async () => {
    if (!novoMembroId || !equipeParaMembros) return;
    const sucesso = await adicionarMembro(equipeParaMembros.id, novoMembroId);
    if (sucesso) {
      setNovoMembroId("");
    }
  };

  const handleRemoverMembro = async (membroId: string) => {
    if (!equipeParaMembros) return;
    await removerMembro(membroId);
  };

  const handleDefinirLider = async (adminUserId: string) => {
    if (!equipeParaMembros) return;
    const sucesso = await updateEquipe(equipeParaMembros.id, {
      responsavel_id: adminUserId,
    });
    if (sucesso) {
      setEquipeParaMembros({
        ...equipeParaMembros,
        responsavel_id: adminUserId,
      });
    }
  };

  const confirmarExclusao = (equipeId: string) => {
    setEquipeParaExcluir(equipeId);
    setDeleteDialogOpen(true);
  };

  const handleExcluir = async () => {
    if (!equipeParaExcluir) return;
    const sucesso = await deleteEquipe(equipeParaExcluir);
    if (sucesso) {
      setDeleteDialogOpen(false);
      setEquipeParaExcluir(null);
    }
  };

  const membrosEquipe = equipeParaMembros
    ? membros.filter(m => m.equipe_id === equipeParaMembros.id)
    : [];

  const usuariosDisponiveis = usuarios.filter(
    u => !membrosEquipe.some(m => m.user_id === u.user_id)
  );

  const breadcrumbItems = [
    { label: "Home", path: "/home" },
    { label: "Direção", path: "/direcao" },
    { label: "Gestão de Instalações", path: "/direcao/gestao-instalacao" },
    { label: "Equipes" }
  ];

  if (loading) {
    return (
      <MinimalistLayout
        title="Gestão de Equipes"
        backPath="/direcao/gestao-instalacao"
        breadcrumbItems={breadcrumbItems}
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout
      title="Gestão de Equipes"
      subtitle="Gerenciar equipes e membros"
      backPath="/direcao/gestao-instalacao"
      breadcrumbItems={breadcrumbItems}
    >
      {/* Seção: Gerente do Setor */}
      <Card className="mb-6 bg-primary/5 border-primary/10 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-white text-base">Gerente do Setor de Instalações</h3>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLideres ? (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              Carregando...
            </div>
          ) : (
            <div className="space-y-3">
              {gerenteAtual?.lider && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={gerenteAtual.lider.foto_perfil_url || undefined} alt={gerenteAtual.lider.nome} />
                    <AvatarFallback className="bg-amber-500/20 text-amber-400 font-semibold">
                      {gerenteAtual.lider.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{gerenteAtual.lider.nome}</p>
                    <p className="text-xs text-white/50 truncate">{gerenteAtual.lider.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerLider.mutate("instalacoes")}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    title="Remover atribuição manual"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-white/70 text-xs">
                    {gerenteAtual?.lider ? "Alterar gerente" : "Definir gerente"}
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      atribuirLider.mutate({ setor: "instalacoes", lider_id: value });
                    }}
                  >
                    <SelectTrigger className="bg-primary/5 border-primary/10 text-white h-9">
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-primary/10">
                      {allUsers
                        .filter(u => u.user_id !== gerenteAtual?.lider_id)
                        .map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id} className="text-white">
                            {user.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Nova Equipe */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={abrirFormNovo}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* Conteúdo */}
      {equipes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-white/50 mb-4" />
          <p className="text-white/60 mb-4">Nenhuma equipe cadastrada</p>
          <Button onClick={abrirFormNovo} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira equipe
          </Button>
        </div>
      ) : (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {equipes.map((equipe) => (
            <Card
              key={equipe.id}
              className="bg-primary/5 border-primary/10 backdrop-blur-xl overflow-hidden"
            >
              <CardHeader
                className="pb-3"
                style={equipe.cor ? { borderLeft: `4px solid ${equipe.cor}` } : {}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {equipe.cor && (
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: equipe.cor }}
                      />
                    )}
                    <h3 className="font-semibold text-lg text-white">{equipe.nome}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirFormEditar(equipe)}
                      className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-primary/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmarExclusao(equipe.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {equipe.responsavel_nome && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={equipe.responsavel_foto} alt={equipe.responsavel_nome} />
                      <AvatarFallback className="text-xs bg-primary/20 text-white">
                        {equipe.responsavel_nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">{equipe.responsavel_nome}</p>
                      <p className="text-xs text-white/60">Líder da equipe</p>
                    </div>
                  </div>
                )}

                {equipe.membros && equipe.membros.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white/60 uppercase">
                      Membros ({equipe.membros.length})
                    </p>
                    <div className="space-y-1.5">
                      {equipe.membros.slice(0, 3).map((membro) => (
                        <div key={membro.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={membro.foto_perfil_url} alt={membro.nome} />
                            <AvatarFallback className="text-[10px] bg-primary/20 text-white">
                              {membro.nome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate text-white/80">{membro.nome}</span>
                        </div>
                      ))}
                      {equipe.membros.length > 3 && (
                        <p className="text-xs text-white/50 pl-8">
                          +{equipe.membros.length - 3} membros
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirMembros(equipe)}
                  className="w-full gap-2 border-primary/30 bg-primary/10 text-white hover:bg-primary/20"
                >
                  <Users className="h-4 w-4" />
                  Gerenciar Membros
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet de Formulário */}
      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`bg-zinc-900 border-primary/10 ${isMobile ? "h-[90vh]" : ""}`}
        >
          <SheetHeader>
            <SheetTitle className="text-white">{equipeEditando ? "Editar Equipe" : "Nova Equipe"}</SheetTitle>
            <SheetDescription className="text-white/60">
              {equipeEditando ? "Atualize as informações da equipe" : "Preencha os dados da nova equipe"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-white">Nome da Equipe *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Equipe Alpha"
                className="bg-primary/5 border-primary/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Cor da Equipe</Label>
              <div className="flex flex-wrap gap-2">
                {CORES_EQUIPES.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setFormCor(cor)}
                    className={`h-10 w-10 rounded-md border-2 transition-all ${
                      formCor === cor ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel" className="text-white">Líder da Equipe (opcional)</Label>
              <Select value={formResponsavel} onValueChange={setFormResponsavel}>
                <SelectTrigger className="bg-primary/5 border-primary/10 text-white">
                  <SelectValue placeholder="Selecione o líder" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-primary/10">
                  <SelectItem value="" className="text-white">Nenhum líder</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id} className="text-white">
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setFormSheetOpen(false)}
                className="flex-1 bg-primary/5 border-primary/10 text-white hover:bg-primary/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitForm}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {equipeEditando ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Gerenciar Membros */}
      <Sheet open={membrosSheetOpen} onOpenChange={setMembrosSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`bg-zinc-900 border-primary/10 ${isMobile ? "h-[90vh]" : ""}`}
        >
          <SheetHeader>
            <SheetTitle className="text-white">Gerenciar Membros</SheetTitle>
            <SheetDescription className="text-white/60">{equipeParaMembros?.nome}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label className="text-white">Adicionar Membro</Label>
              <div className="flex gap-2">
                <Select value={novoMembroId} onValueChange={setNovoMembroId}>
                  <SelectTrigger className="flex-1 bg-primary/5 border-primary/10 text-white">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-primary/10">
                    {usuariosDisponiveis.map((usuario) => (
                      <SelectItem key={usuario.user_id} value={usuario.user_id} className="text-white">
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAdicionarMembro}
                  disabled={!novoMembroId}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Membros da Equipe</Label>
              <div className="border border-primary/10 rounded-md divide-y divide-primary/10 max-h-[400px] overflow-y-auto bg-primary/5">
                {membrosEquipe.length === 0 ? (
                  <p className="text-sm text-white/50 text-center py-4">
                    Nenhum membro adicionado
                  </p>
                ) : (
                  membrosEquipe.map((membro) => {
                    const isLider = membro.user?.id === equipeParaMembros?.responsavel_id;
                    return (
                      <div key={membro.id} className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={membro.user?.foto_perfil_url} alt={membro.user?.nome} />
                          <AvatarFallback className="bg-primary/20 text-white">{membro.user?.nome?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate text-white">{membro.user?.nome}</p>
                            {isLider && <Crown className="h-3 w-3 text-amber-500" />}
                          </div>
                          <p className="text-xs text-white/50 truncate">{membro.user?.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {!isLider && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDefinirLider(membro.user?.id || '')}
                              className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-primary/20"
                            >
                              <Crown className="h-3 w-3 mr-1" />
                              Líder
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverMembro(membro.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-primary/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
