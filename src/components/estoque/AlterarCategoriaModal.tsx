import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProdutoEstoque } from "@/hooks/useEstoque";
import { useCategorias } from "@/hooks/useCategorias";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlterarCategoriaModalProps {
  produto: ProdutoEstoque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlterarCategoria: (novaCategoria: string) => Promise<void>;
}

const CATEGORIAS = [
  { value: "geral", label: "Geral", color: "bg-gray-500" },
  { value: "ferragem", label: "Ferragem", color: "bg-blue-500" },
  { value: "acessorio", label: "Acessório", color: "bg-purple-500" },
  { value: "perfil", label: "Perfil", color: "bg-green-500" },
  { value: "componente", label: "Componente", color: "bg-orange-500" },
  { value: "consumivel", label: "Consumível", color: "bg-red-500" },
];

const getCategoriaLabel = (categoria: string) => {
  const cat = CATEGORIAS.find(c => c.value === categoria);
  return cat?.label || categoria;
};

export function AlterarCategoriaModal({ 
  produto, 
  open, 
  onOpenChange, 
  onAlterarCategoria 
}: AlterarCategoriaModalProps) {
  const [novaCategoria, setNovaCategoria] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { categorias } = useCategorias();

  const getCategoriaColor = (cor: string) => `bg-${cor}-500`;

  const handleSubmit = async () => {
    if (!produto || !novaCategoria) return;

    setLoading(true);
    try {
      await onAlterarCategoria(novaCategoria);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!produto) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) setNovaCategoria("");
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Categoria</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">{produto.nome_produto}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Categoria atual:</span>
              <Badge>
                {produto.categoria}
              </Badge>
            </div>
          </div>

          <div>
            <Label>Nova Categoria</Label>
            <RadioGroup 
              value={novaCategoria} 
              onValueChange={setNovaCategoria}
              className="mt-2"
            >
              {categorias.map((cat) => (
                <div 
                  key={cat.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <RadioGroupItem value={cat.nome.toLowerCase()} id={cat.id} />
                  <label 
                    htmlFor={cat.id} 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Tag className="h-4 w-4" />
                    <Badge className={getCategoriaColor(cat.cor)}>
                      {cat.nome}
                    </Badge>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !novaCategoria || novaCategoria === produto.categoria}
              className="flex-1"
            >
              {loading ? "Processando..." : "Alterar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
