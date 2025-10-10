import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEstoque } from "@/hooks/useEstoque";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Estoque() {
  const { produtos, loading, adicionarProduto } = useEstoque();
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({
    nome_produto: "",
    descricao_produto: "",
    quantidade: 0,
    unidade: "UN",
  });

  const handleSubmit = async () => {
    await adicionarProduto(formData);
    setFormData({ nome_produto: "", descricao_produto: "", quantidade: 0, unidade: "UN" });
    setModalAberto(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Controle de Estoque</h1>
            <p className="text-muted-foreground">Gestão de materiais e inventário</p>
          </div>
        </div>
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Produto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={formData.nome_produto} onChange={(e) => setFormData({...formData, nome_produto: e.target.value})} /></div>
              <div><Label>Descrição</Label><Input value={formData.descricao_produto} onChange={(e) => setFormData({...formData, descricao_produto: e.target.value})} /></div>
              <div><Label>Quantidade</Label><Input type="number" value={formData.quantidade} onChange={(e) => setFormData({...formData, quantidade: parseInt(e.target.value)})} /></div>
              <Button onClick={handleSubmit} className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {produtos.map((produto) => (
          <Card key={produto.id}>
            <CardHeader>
              <CardTitle>{produto.nome_produto}</CardTitle>
              <CardDescription>{produto.descricao_produto}</CardDescription>
            </CardHeader>
            <CardContent>Quantidade: {produto.quantidade} {produto.unidade}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
