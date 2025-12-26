import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Palette, Plus, Pencil, ArrowLeft, Loader2 } from "lucide-react";
import { useCatalogoCores, CatalogoCorInput } from "@/hooks/useCatalogoCores";

export default function CatalogoCores() {
  const navigate = useNavigate();
  const { cores, isLoading, adicionarCor, editarCor, toggleAtiva } = useCatalogoCores();
  
  const [modalAberto, setModalAberto] = useState(false);
  const [editarModal, setEditarModal] = useState(false);
  const [corEditando, setCorEditando] = useState<any>(null);
  const [formData, setFormData] = useState<CatalogoCorInput>({
    nome: "",
    codigo_hex: "#000000",
    ativa: true,
  });

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      return;
    }
    await adicionarCor.mutateAsync(formData);
    resetForm();
    setModalAberto(false);
  };

  const handleEditar = async () => {
    if (!corEditando || !formData.nome.trim()) return;
    await editarCor.mutateAsync({
      id: corEditando.id,
      ...formData,
    });
    resetForm();
    setEditarModal(false);
  };

  const handleOpenEditar = (cor: any) => {
    setCorEditando(cor);
    setFormData({
      nome: cor.nome,
      codigo_hex: cor.codigo_hex,
      ativa: cor.ativa,
    });
    setEditarModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo_hex: "#000000",
      ativa: true,
    });
    setCorEditando(null);
  };

  const FormularioCor = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div 
          className="w-20 h-20 rounded-lg border-2 shadow-inner flex-shrink-0"
          style={{ backgroundColor: formData.codigo_hex }}
        />
        <div className="flex-1 space-y-3">
          <div>
            <Label htmlFor="nome">Nome da Cor *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Azul Royal"
            />
          </div>
          <div>
            <Label htmlFor="codigo_hex">Código HEX *</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.codigo_hex}
                onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                className="w-14 h-10 p-1 cursor-pointer"
              />
              <Input
                id="codigo_hex"
                value={formData.codigo_hex}
                onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ativa" className="cursor-pointer">Cor ativa</Label>
        <Switch
          id="ativa"
          checked={formData.ativa}
          onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
        />
      </div>

      <Button 
        onClick={isEdit ? handleEditar : handleSubmit} 
        className="w-full"
        disabled={adicionarCor.isPending || editarCor.isPending}
      >
        {(adicionarCor.isPending || editarCor.isPending) && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        )}
        {isEdit ? "Salvar Alterações" : "Adicionar Cor"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/dashboard/vendas/vendas-catalogo")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Palette className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Cores do Catálogo</h1>
            <p className="text-muted-foreground">Gerencie as cores disponíveis para os produtos</p>
          </div>
        </div>
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Cor</DialogTitle>
            </DialogHeader>
            <FormularioCor />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cores Cadastradas</CardTitle>
          <CardDescription>
            {cores.length} cor{cores.length !== 1 ? "es" : ""} cadastrada{cores.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cores.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Palette className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma cor cadastrada</p>
              <p className="text-sm">Adicione sua primeira cor clicando em "Nova Cor"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cores.map((cor) => (
                <Card 
                  key={cor.id} 
                  className={`overflow-hidden hover:shadow-lg transition-all group ${
                    !cor.ativa ? "opacity-60" : ""
                  }`}
                >
                  <div 
                    className="aspect-square relative"
                    style={{ backgroundColor: cor.codigo_hex }}
                  >
                    {!cor.ativa && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 text-xs"
                      >
                        Inativa
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenEditar(cor)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate" title={cor.nome}>
                      {cor.nome}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <code className="text-xs text-muted-foreground uppercase">
                        {cor.codigo_hex}
                      </code>
                      <Switch
                        checked={cor.ativa}
                        onCheckedChange={(checked) => 
                          toggleAtiva.mutate({ id: cor.id, ativa: checked })
                        }
                        className="scale-75"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editarModal} onOpenChange={setEditarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cor</DialogTitle>
          </DialogHeader>
          <FormularioCor isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
