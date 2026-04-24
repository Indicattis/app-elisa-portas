import { useState } from "react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Palette, Plus, Pencil, Loader2 } from "lucide-react";
import { useCatalogoCores, CatalogoCorInput } from "@/hooks/useCatalogoCores";

export default function CatalogoCores() {
  const { cores, isLoading, adicionarCor, editarCor, toggleAtiva } = useCatalogoCores();

  const [modalAberto, setModalAberto] = useState(false);
  const [corEditando, setCorEditando] = useState<any>(null);
  const [formData, setFormData] = useState<CatalogoCorInput>({
    nome: "",
    codigo_hex: "#000000",
    ativa: true,
  });

  const resetForm = () => {
    setFormData({ nome: "", codigo_hex: "#000000", ativa: true });
    setCorEditando(null);
  };

  const handleOpenNova = () => {
    resetForm();
    setModalAberto(true);
  };

  const handleOpenEditar = (cor: any) => {
    setCorEditando(cor);
    setFormData({ nome: cor.nome, codigo_hex: cor.codigo_hex, ativa: cor.ativa });
    setModalAberto(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) return;
    if (corEditando) {
      await editarCor.mutateAsync({ id: corEditando.id, ...formData });
    } else {
      await adicionarCor.mutateAsync(formData);
    }
    resetForm();
    setModalAberto(false);
  };

  const isPending = adicionarCor.isPending || editarCor.isPending;

  return (
    <MinimalistLayout
      title="Cores do Catálogo"
      subtitle={`${cores.length} cor${cores.length !== 1 ? "es" : ""} cadastrada${cores.length !== 1 ? "s" : ""}`}
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Catálogo", path: "/marketing/catalogo" },
        { label: "Cores" },
      ]}
      headerActions={
        <Button onClick={handleOpenNova} className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nova Cor
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : cores.length === 0 ? (
        <div className="text-center py-20">
          <Palette className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-lg">Nenhuma cor cadastrada</p>
          <p className="text-white/40 text-sm">Adicione sua primeira cor clicando em "Nova Cor"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cores.map((cor) => (
            <div
              key={cor.id}
              className={`bg-primary/5 border border-primary/10 rounded-xl overflow-hidden backdrop-blur-xl
                hover:bg-primary/10 hover:border-blue-500/30 transition-all group ${!cor.ativa ? "opacity-50" : ""}`}
            >
              <div
                className="aspect-square relative cursor-pointer"
                style={{ backgroundColor: cor.codigo_hex }}
                onClick={() => handleOpenEditar(cor)}
              >
                {!cor.ativa && (
                  <Badge className="absolute top-2 left-2 bg-black/50 text-white text-xs">Inativa</Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate">{cor.nome}</h3>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-xs text-white/50 uppercase">{cor.codigo_hex}</code>
                  <Switch
                    checked={cor.ativa}
                    onCheckedChange={(checked) => toggleAtiva.mutate({ id: cor.id, ativa: checked })}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalAberto} onOpenChange={(open) => { if (!open) resetForm(); setModalAberto(open); }}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{corEditando ? "Editar Cor" : "Nova Cor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                style={{ backgroundColor: formData.codigo_hex }}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="text-white/70">Nome da Cor *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Azul Royal"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Código HEX *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.codigo_hex}
                      onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.codigo_hex}
                      onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/70 cursor-pointer">Cor ativa</Label>
              <Switch
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {corEditando ? "Salvar Alterações" : "Adicionar Cor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}
