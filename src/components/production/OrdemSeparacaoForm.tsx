import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface ItemOrdem {
  id: string;
  item: string;
  quantidade: number;
  medidas: string;
}

interface OrdemSeparacaoFormProps {
  pedidoId: string;
  isOpen: boolean;
  onSave: (items: ItemOrdem[]) => void;
  onCancel: () => void;
  maxOrdens: number;
}

export default function OrdemSeparacaoForm({ 
  pedidoId, 
  isOpen, 
  onSave, 
  onCancel,
  maxOrdens 
}: OrdemSeparacaoFormProps) {
  const [items, setItems] = useState<ItemOrdem[]>([
    { id: crypto.randomUUID(), item: "", quantidade: 1, medidas: "" }
  ]);

  const addItem = () => {
    if (items.length < maxOrdens) {
      setItems([...items, { 
        id: crypto.randomUUID(), 
        item: "", 
        quantidade: 1, 
        medidas: "" 
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemOrdem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    const validItems = items.filter(item => item.item.trim() !== "");
    if (validItems.length > 0) {
      onSave(validItems);
    }
  };

  if (!isOpen) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Ordens de Separação</CardTitle>
        <p className="text-sm text-muted-foreground">
          Máximo de {maxOrdens} ordem(ns) baseado nos produtos do pedido
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Medidas</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    value={item.item}
                    onChange={(e) => updateItem(item.id, "item", e.target.value)}
                    placeholder="Digite o item..."
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateItem(item.id, "quantidade", parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.medidas}
                    onChange={(e) => updateItem(item.id, "medidas", e.target.value)}
                    placeholder="Ex: 2x3m"
                  />
                </TableCell>
                <TableCell>
                  {items.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={addItem}
            disabled={items.length >= maxOrdens}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Ordens
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}