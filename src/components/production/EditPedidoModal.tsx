
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  produto_tipo: string;
  produto_cor: string;
  produto_altura: string;
  produto_largura: string;
  data_entrega: string | null;
  status: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_cep?: string;
  endereco_estado?: string;
  observacoes?: string;
}

interface EditPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  onSave: () => void;
  catalogoCores: { nome: string; codigo_hex: string }[];
}

const tiposProduto = [
  'Porta de Enrolar',
  'Kit Porta Social',
  'Porta de Correr',
  'Porta Basculante',
  'Portão Social'
];

export function EditPedidoModal({ isOpen, onClose, pedido, onSave, catalogoCores }: EditPedidoModalProps) {
  const [formData, setFormData] = useState<Partial<Pedido>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pedido) {
      setFormData(pedido);
    }
  }, [pedido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("pedidos_producao")
        .update({
          numero_pedido: formData.numero_pedido,
          cliente_nome: formData.cliente_nome,
          cliente_telefone: formData.cliente_telefone,
          produto_tipo: formData.produto_tipo,
          produto_cor: formData.produto_cor,
          produto_altura: formData.produto_altura,
          produto_largura: formData.produto_largura,
          data_entrega: formData.data_entrega,
          endereco_rua: formData.endereco_rua,
          endereco_numero: formData.endereco_numero,
          endereco_bairro: formData.endereco_bairro,
          endereco_cidade: formData.endereco_cidade,
          endereco_estado: formData.endereco_estado,
          endereco_cep: formData.endereco_cep,
          observacoes: formData.observacoes,
        })
        .eq("id", pedido.id);

      if (error) throw error;

      toast.success("Pedido atualizado com sucesso!");
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      toast.error("Erro ao atualizar pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Pedido, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_pedido">Número do Pedido</Label>
              <Input
                id="numero_pedido"
                value={formData.numero_pedido || ""}
                onChange={(e) => handleInputChange("numero_pedido", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="cliente_nome">Nome do Cliente</Label>
              <Input
                id="cliente_nome"
                value={formData.cliente_nome || ""}
                onChange={(e) => handleInputChange("cliente_nome", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cliente_telefone">Telefone</Label>
            <Input
              id="cliente_telefone"
              value={formData.cliente_telefone || ""}
              onChange={(e) => handleInputChange("cliente_telefone", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="produto_tipo">Tipo do Produto</Label>
              <Select value={formData.produto_tipo || ""} onValueChange={(value) => handleInputChange("produto_tipo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProduto.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="produto_cor">Cor</Label>
              <Select value={formData.produto_cor || ""} onValueChange={(value) => handleInputChange("produto_cor", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {catalogoCores.map((cor) => (
                    <SelectItem key={cor.nome} value={cor.nome}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded border border-gray-300" 
                          style={{ backgroundColor: cor.codigo_hex }}
                        />
                        {cor.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="produto_altura">Altura</Label>
              <Input
                id="produto_altura"
                value={formData.produto_altura || ""}
                onChange={(e) => handleInputChange("produto_altura", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="produto_largura">Largura</Label>
              <Input
                id="produto_largura"
                value={formData.produto_largura || ""}
                onChange={(e) => handleInputChange("produto_largura", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="data_entrega">Data de Entrega</Label>
            <Input
              id="data_entrega"
              type="date"
              value={formData.data_entrega || ""}
              onChange={(e) => handleInputChange("data_entrega", e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Endereço</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="endereco_rua">Rua</Label>
                <Input
                  id="endereco_rua"
                  value={formData.endereco_rua || ""}
                  onChange={(e) => handleInputChange("endereco_rua", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endereco_numero">Número</Label>
                <Input
                  id="endereco_numero"
                  value={formData.endereco_numero || ""}
                  onChange={(e) => handleInputChange("endereco_numero", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="endereco_bairro">Bairro</Label>
                <Input
                  id="endereco_bairro"
                  value={formData.endereco_bairro || ""}
                  onChange={(e) => handleInputChange("endereco_bairro", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endereco_cidade">Cidade</Label>
                <Input
                  id="endereco_cidade"
                  value={formData.endereco_cidade || ""}
                  onChange={(e) => handleInputChange("endereco_cidade", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endereco_estado">Estado</Label>
                <Input
                  id="endereco_estado"
                  value={formData.endereco_estado || ""}
                  onChange={(e) => handleInputChange("endereco_estado", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco_cep">CEP</Label>
              <Input
                id="endereco_cep"
                value={formData.endereco_cep || ""}
                onChange={(e) => handleInputChange("endereco_cep", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ""}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
