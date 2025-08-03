import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { CanaisAquisicaoService } from "@/services/canaisAquisicaoService";
import type { CanalAquisicao } from "@/hooks/useCanaisAquisicao";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface CanalFormData {
  nome: string;
  ativo: boolean;
  ordem: number;
}

export function CanaisAquisicaoManager() {
  const [canais, setCanais] = useState<CanalAquisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCanal, setEditingCanal] = useState<CanalAquisicao | null>(null);
  const [deletingCanal, setDeletingCanal] = useState<CanalAquisicao | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CanalFormData>({
    nome: "",
    ativo: true,
    ordem: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCanais();
  }, []);

  const fetchCanais = async () => {
    try {
      setLoading(true);
      const data = await CanaisAquisicaoService.getAll();
      setCanais(data);
    } catch (error) {
      console.error("Erro ao buscar canais:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os canais de aquisição.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", ativo: true, ordem: 0 });
    setEditingCanal(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCanal) {
        await CanaisAquisicaoService.update(editingCanal.id, formData);
        toast({
          title: "Sucesso",
          description: "Canal atualizado com sucesso.",
        });
      } else {
        // Se não especificou ordem, usar próximo número
        const maxOrdem = Math.max(...canais.map(c => c.ordem), 0);
        const dadosCanal = { 
          ...formData, 
          ordem: formData.ordem || maxOrdem + 1 
        };
        await CanaisAquisicaoService.create(dadosCanal);
        toast({
          title: "Sucesso",
          description: "Canal criado com sucesso.",
        });
      }
      
      resetForm();
      fetchCanais();
    } catch (error) {
      console.error("Erro ao salvar canal:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar canal.",
      });
    }
  };

  const handleEdit = (canal: CanalAquisicao) => {
    setEditingCanal(canal);
    setFormData({
      nome: canal.nome,
      ativo: canal.ativo,
      ordem: canal.ordem
    });
    setShowForm(true);
  };

  const handleDelete = async (canal: CanalAquisicao) => {
    try {
      await CanaisAquisicaoService.delete(canal.id);
      toast({
        title: "Sucesso",
        description: "Canal excluído com sucesso.",
      });
      fetchCanais();
    } catch (error) {
      console.error("Erro ao excluir canal:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir canal.",
      });
    } finally {
      setDeletingCanal(null);
    }
  };

  const handleToggleAtivo = async (canal: CanalAquisicao) => {
    try {
      await CanaisAquisicaoService.update(canal.id, { ativo: !canal.ativo });
      toast({
        title: "Sucesso",
        description: `Canal ${!canal.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      });
      fetchCanais();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao alterar status do canal.",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canais de Aquisição</h1>
          <p className="text-muted-foreground">
            Gerencie os canais de aquisição disponíveis no sistema
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Canal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCanal ? "Editar Canal" : "Novo Canal"}
              </DialogTitle>
              <DialogDescription>
                {editingCanal 
                  ? "Edite as informações do canal de aquisição." 
                  : "Adicione um novo canal de aquisição ao sistema."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Canal</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Google, Meta, LinkedIn..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem de Exibição</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Canal ativo</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCanal ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canais Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {canais.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum canal de aquisição cadastrado.
              </p>
            ) : (
              canais.map((canal) => (
                <div
                  key={canal.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{canal.nome}</span>
                      <Badge variant={canal.ativo ? "default" : "secondary"}>
                        {canal.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Ordem: {canal.ordem}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={canal.ativo}
                      onCheckedChange={() => handleToggleAtivo(canal)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(canal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingCanal(canal)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingCanal} onOpenChange={() => setDeletingCanal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o canal "{deletingCanal?.nome}"?
              Esta ação não pode ser desfeita e pode afetar dados existentes.
              {" "}
              <strong>Recomendamos desativar em vez de excluir.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCanal && handleDelete(deletingCanal)}
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