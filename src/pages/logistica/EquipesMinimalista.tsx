import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Edit2, Trash2, ArrowLeft, Crown, LogOut } from "lucide-react";
import { SpaceParticles } from "@/components/SpaceParticles";
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
import { useAuth } from "@/hooks/useAuth";
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

export default function EquipesMinimalista() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
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
  
  const [formNome, setFormNome] = useState("");
  const [formCor, setFormCor] = useState(CORES_EQUIPES[0]);
  const [formResponsavel, setFormResponsavel] = useState("");
  const [novoMembroId, setNovoMembroId] = useState("");

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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <SpaceParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/logistica/instalacoes')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Gestão de Equipes</h1>
                <p className="text-xs text-white/60">Gerenciar equipes e membros</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={abrirFormNovo} size="sm" className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nova Equipe</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : equipes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-white/50 mb-4" />
              <p className="text-white/60 mb-4">Nenhuma equipe cadastrada</p>
              <Button onClick={abrirFormNovo}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira equipe
              </Button>
            </div>
          ) : (
            <div className={`max-w-7xl mx-auto grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
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
                          <AvatarFallback className="text-xs bg-primary/20">
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
                                <AvatarFallback className="text-[10px] bg-primary/20">
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
        </main>
      </div>

      {/* Sheet de Formulário */}
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
            <SheetDescription>{equipeParaMembros?.nome}</SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
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

            <div className="space-y-2">
              <Label>Membros da Equipe</Label>
              <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                {membrosEquipe.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro adicionado
                  </p>
                ) : (
                  membrosEquipe.map((membro) => {
                    const isLider = membro.user?.id === equipeParaMembros?.responsavel_id;
                    return (
                      <div key={membro.id} className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={membro.user?.foto_perfil_url} alt={membro.user?.nome} />
                          <AvatarFallback>{membro.user?.nome?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{membro.user?.nome}</p>
                            {isLider && <Crown className="h-3 w-3 text-amber-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{membro.user?.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {!isLider && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDefinirLider(membro.user?.id || '')}
                              className="h-8 px-2 text-xs"
                            >
                              <Crown className="h-3 w-3 mr-1" />
                              Líder
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverMembro(membro.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
