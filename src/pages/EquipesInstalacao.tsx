import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, Users, Edit2, Trash2, ArrowLeft, Crown } from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoInstalacoes from "@/assets/logo-instalacoes.png";

const CORES_EQUIPES = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
];

interface Usuario {
  user_id: string;
  nome: string;
  email: string;
  id: string;
  foto_perfil_url?: string;
}

export default function EquipesInstalacao() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { equipes, loading, createEquipe, updateEquipe, deleteEquipe } = useEquipesInstalacao();
  const { membros, adicionarMembro, removerMembro } = useEquipesMembros();
  
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [membrosSheetOpen, setMembrosSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [equipeEditando, setEquipeEditando] = useState<any>(null);
  const [equipeParaMembros, setEquipeParaMembros] = useState<any>(null);
  const [equipeParaExcluir, setEquipeParaExcluir] = useState<string | null>(null);
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  
  // Form state
  const [formNome, setFormNome] = useState("");
  const [formCor, setFormCor] = useState(CORES_EQUIPES[0]);
  const [formResponsavel, setFormResponsavel] = useState("");
  const [novoMembroId, setNovoMembroId] = useState("");

  // Carregar usuários disponíveis
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

  const handleDefinirLider = async (userId: string) => {
    if (!equipeParaMembros) return;

    const sucesso = await updateEquipe(equipeParaMembros.id, {
      responsavel_id: userId,
    });

    if (sucesso) {
      // Atualizar o estado local da equipe
      setEquipeParaMembros({
        ...equipeParaMembros,
        responsavel_id: userId,
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

  // Membros da equipe selecionada
  const membrosEquipe = equipeParaMembros 
    ? membros.filter(m => m.equipe_id === equipeParaMembros.id)
    : [];

  // Usuários disponíveis para adicionar (não são membros ainda)
  const usuariosDisponiveis = usuarios.filter(
    u => !membrosEquipe.some(m => m.user_id === u.user_id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/instalacoes")}
              className="h-9 w-9 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src={logoInstalacoes} 
              alt="Logo" 
              className="h-9 w-9 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Equipes de Instalação</h1>
              <p className="text-xs text-muted-foreground">Gerenciar equipes e membros</p>
            </div>
          </div>
          
          <Button onClick={abrirFormNovo} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Equipe</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8">
        {equipes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma equipe cadastrada</p>
            <Button onClick={abrirFormNovo}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira equipe
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {equipes.map((equipe) => (
              <Card key={equipe.id} className="overflow-hidden">
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
                      <h3 className="font-semibold text-lg">{equipe.nome}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirFormEditar(equipe)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmarExclusao(equipe.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Líder */}
                  {equipe.responsavel_nome && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={equipe.responsavel_foto} alt={equipe.responsavel_nome} />
                        <AvatarFallback className="text-xs">
                          {equipe.responsavel_nome.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{equipe.responsavel_nome}</p>
                        <p className="text-xs text-muted-foreground">Líder da equipe</p>
                      </div>
                    </div>
                  )}

                  {/* Membros */}
                  {equipe.membros && equipe.membros.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Membros ({equipe.membros.length})
                      </p>
                      <div className="space-y-1.5">
                        {equipe.membros.slice(0, 3).map((membro) => (
                          <div key={membro.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={membro.foto_perfil_url} alt={membro.nome} />
                              <AvatarFallback className="text-[10px]">
                                {membro.nome.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{membro.nome}</span>
                          </div>
                        ))}
                        {equipe.membros.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-8">
                            +{equipe.membros.length - 3} membros
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botão Gerenciar Membros */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirMembros(equipe)}
                    className="w-full gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Gerenciar Membros
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Sheet de Formulário (Criar/Editar Equipe) */}
      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : ""}>
          <SheetHeader>
            <SheetTitle>{equipeEditando ? "Editar Equipe" : "Nova Equipe"}</SheetTitle>
            <SheetDescription>
              {equipeEditando ? "Atualize as informações da equipe" : "Preencha os dados da nova equipe"}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Equipe *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Equipe Alpha"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor da Equipe</Label>
              <div className="flex flex-wrap gap-2">
                {CORES_EQUIPES.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setFormCor(cor)}
                    className={`h-10 w-10 rounded-md border-2 transition-all ${
                      formCor === cor ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Líder da Equipe (opcional)</Label>
              <Select value={formResponsavel} onValueChange={setFormResponsavel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o líder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum líder</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setFormSheetOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSubmitForm} className="flex-1">
                {equipeEditando ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Gerenciar Membros */}
      <Sheet open={membrosSheetOpen} onOpenChange={setMembrosSheetOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : ""}>
          <SheetHeader>
            <SheetTitle>Gerenciar Membros</SheetTitle>
            <SheetDescription>
              {equipeParaMembros?.nome}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            {/* Adicionar Membro */}
            <div className="space-y-2">
              <Label>Adicionar Membro</Label>
              <div className="flex gap-2">
                <Select value={novoMembroId} onValueChange={setNovoMembroId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuariosDisponiveis.map((usuario) => (
                      <SelectItem key={usuario.user_id} value={usuario.user_id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAdicionarMembro} disabled={!novoMembroId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de Membros */}
            <div className="space-y-2">
              <Label>Membros da Equipe</Label>
              <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                {membrosEquipe.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro adicionado
                  </p>
                ) : (
                  membrosEquipe.map((membro) => {
                    const isLider = membro.user_id === equipeParaMembros?.responsavel_id;
                    return (
                      <div key={membro.id} className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={membro.user?.foto_perfil_url} alt={membro.user?.nome} />
                          <AvatarFallback>
                            {membro.user?.nome?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{membro.user?.nome}</p>
                            {isLider && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                <Crown className="h-3 w-3" />
                                <span className="text-[10px] font-medium">Líder</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{membro.user?.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isLider && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDefinirLider(membro.user_id)}
                                className="h-8 px-2 gap-1 text-amber-600 hover:text-amber-600 hover:bg-amber-50"
                                title="Tornar líder"
                              >
                                <Crown className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">Líder</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverMembro(membro.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Remover membro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar esta equipe? Esta ação pode ser revertida posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
