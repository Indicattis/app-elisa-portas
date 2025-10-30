import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Flame, Settings } from "lucide-react";
import { TabelaLinhasEditavel } from "./TabelaLinhasEditavel";
import { AdicionarLinhaModal } from "./AdicionarLinhaModal";
import type { PedidoLinha, PedidoLinhaNova, PedidoLinhaUpdate, CategoriaLinha } from "@/hooks/usePedidoLinhas";

interface LinhasCategorizadasProps {
  linhas: PedidoLinha[];
  isReadOnly: boolean;
  onAdicionarLinha: (linha: PedidoLinhaNova) => Promise<any>;
  onRemoverLinha: (id: string) => Promise<void>;
  onChange: (linhasEditadas: Map<string, PedidoLinhaUpdate>) => void;
  linhasEditadas: Map<string, PedidoLinhaUpdate>;
}

const CATEGORIAS = [
  {
    key: 'separacao' as CategoriaLinha,
    label: 'Separação',
    icon: Package,
    description: 'Acessórios, adicionais e produtos gerais',
  },
  {
    key: 'solda' as CategoriaLinha,
    label: 'Solda',
    icon: Flame,
    description: 'Itens que necessitam soldagem',
  },
  {
    key: 'perfiladeira' as CategoriaLinha,
    label: 'Perfiladeira',
    icon: Settings,
    description: 'Itens processados na perfiladeira',
  },
];

export function LinhasCategorizadas({
  linhas,
  isReadOnly,
  onAdicionarLinha,
  onRemoverLinha,
  onChange,
  linhasEditadas,
}: LinhasCategorizadasProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState<CategoriaLinha>('separacao');

  const handleAbrirModal = (categoria: CategoriaLinha) => {
    setCategoriaAtual(categoria);
    setModalAberto(true);
  };

  return (
    <>
      <div className="space-y-3">
        {CATEGORIAS.map(({ key, label, icon: Icon, description }) => {
          const linhasCategoria = linhas.filter(l => l.categoria_linha === key);

          return (
            <Card key={key}>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAbrirModal(key)}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <TabelaLinhasEditavel
                  linhas={linhasCategoria}
                  isReadOnly={isReadOnly}
                  onRemover={onRemoverLinha}
                  onChange={onChange}
                  linhasEditadas={linhasEditadas}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AdicionarLinhaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        categoria={categoriaAtual}
        onAdicionar={onAdicionarLinha}
      />
    </>
  );
}
