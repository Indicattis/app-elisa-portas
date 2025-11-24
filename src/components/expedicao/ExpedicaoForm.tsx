import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ExpedicaoFormProps {
  onSubmit: (data: any) => Promise<void>;
}

export function ExpedicaoForm({ onSubmit }: ExpedicaoFormProps) {
  const [formData, setFormData] = useState({
    nome_cliente: '',
    hora: '08:00',
    data_carregamento: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome do Cliente</Label>
        <Input
          value={formData.nome_cliente}
          onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Data</Label>
        <Input
          type="date"
          value={formData.data_carregamento}
          onChange={(e) => setFormData({ ...formData, data_carregamento: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Hora</Label>
        <Input
          type="time"
          value={formData.hora}
          onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
          required
        />
      </div>
      <Button type="submit">Criar Ordem</Button>
    </form>
  );
}
