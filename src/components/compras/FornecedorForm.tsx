import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fornecedor, FornecedorFormData } from "@/hooks/useFornecedores";
import { ESTADOS_BRASIL, CIDADES_POR_ESTADO } from "@/utils/estadosCidades";

interface FornecedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FornecedorFormData) => Promise<void>;
  fornecedor?: Fornecedor;
  isSubmitting?: boolean;
}

export const FornecedorForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  fornecedor,
  isSubmitting = false 
}: FornecedorFormProps) => {
  const [formData, setFormData] = useState<FornecedorFormData>({
    tipo: "juridica",
    nome: "",
    responsavel: "",
    cnpj: "",
    estado: "",
    cidade: "",
    bairro: "",
    cep: "",
  });

  const [cidades, setCidades] = useState<string[]>([]);

  useEffect(() => {
    if (fornecedor) {
      setFormData({
        tipo: fornecedor.tipo,
        nome: fornecedor.nome,
        responsavel: fornecedor.responsavel || "",
        cnpj: fornecedor.cnpj || "",
        estado: fornecedor.estado || "",
        cidade: fornecedor.cidade || "",
        bairro: fornecedor.bairro || "",
        cep: fornecedor.cep || "",
      });
      
      if (fornecedor.estado) {
        const estadoObj = ESTADOS_BRASIL.find(e => e.nome === fornecedor.estado);
        if (estadoObj && CIDADES_POR_ESTADO[estadoObj.sigla]) {
          setCidades(CIDADES_POR_ESTADO[estadoObj.sigla]);
        }
      }
    } else {
      setFormData({
        tipo: "juridica",
        nome: "",
        responsavel: "",
        cnpj: "",
        estado: "",
        cidade: "",
        bairro: "",
        cep: "",
      });
      setCidades([]);
    }
  }, [fornecedor, open]);

  const handleEstadoChange = (estado: string) => {
    setFormData(prev => ({ ...prev, estado, cidade: "" }));
    const estadoObj = ESTADOS_BRASIL.find(e => e.nome === estado);
    if (estadoObj && CIDADES_POR_ESTADO[estadoObj.sigla]) {
      setCidades(CIDADES_POR_ESTADO[estadoObj.sigla]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "fisica" | "juridica") => 
                  setFormData(prev => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ/CPF</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={handleEstadoChange}
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map((estado) => (
                    <SelectItem key={estado.sigla} value={estado.nome}>
                      {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Select
                value={formData.cidade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cidade: value }))}
                disabled={!formData.estado}
              >
                <SelectTrigger id="cidade">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
