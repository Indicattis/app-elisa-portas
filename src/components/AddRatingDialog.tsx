import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRatingInput } from "./StarRatingInput";
import { useAutorizadosRatings, CreateRatingData } from "@/hooks/useAutorizadosRatings";
import { Star } from "lucide-react";

interface AddRatingDialogProps {
  autorizadoId: string;
  autorizadoNome: string;
  children?: React.ReactNode;
}

const categoriaLabels = {
  'instalacao': 'Instalação',
  'suporte': 'Suporte',
  'atendimento': 'Atendimento'
} as const;

export function AddRatingDialog({ autorizadoId, autorizadoNome, children }: AddRatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [categoria, setCategoria] = useState<'instalacao' | 'suporte' | 'atendimento'>('instalacao');
  const [descricao, setDescricao] = useState('');

  const { createRating, isCreating } = useAutorizadosRatings();

  const handleSubmit = () => {
    if (rating === 0) return;

    const ratingData: CreateRatingData = {
      autorizado_id: autorizadoId,
      categoria,
      nota: rating,
      descricao: descricao.trim() || undefined,
    };

    createRating(ratingData, {
      onSuccess: () => {
        setOpen(false);
        setRating(0);
        setCategoria('instalacao');
        setDescricao('');
      },
    });
  };

  const resetForm = () => {
    setRating(0);
    setCategoria('instalacao');
    setDescricao('');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Star className="mr-1 h-4 w-4" />
            Avaliar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {autorizadoNome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={(value) => setCategoria(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Avaliação</Label>
            <div className="mt-2">
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua experiência..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0 || isCreating}
            >
              {isCreating ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}