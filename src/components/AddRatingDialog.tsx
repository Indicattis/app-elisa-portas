import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StarRatingInput } from "./StarRatingInput";
import { useAutorizadosRatings, CreateRatingData } from "@/hooks/useAutorizadosRatings";
import { Star, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddRatingDialogProps {
  autorizadoId: string;
  autorizadoNome: string;
  children?: React.ReactNode;
}

const categoriaLabels = {
  'instalacao': 'Instalação',
  'bos': 'B.O\'s',
  'visita_tecnica': 'Visita Técnica',
  'manutencao': 'Manutenção'
} as const;

export function AddRatingDialog({ autorizadoId, autorizadoNome, children }: AddRatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [categoria, setCategoria] = useState<'instalacao' | 'bos' | 'visita_tecnica' | 'manutencao'>('instalacao');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState<Date>();
  const [custo, setCusto] = useState('');

  const { createRating, isCreating } = useAutorizadosRatings();

  const handleSubmit = () => {
    if (rating === 0 || !descricao.trim()) return;

    const ratingData: CreateRatingData = {
      autorizado_id: autorizadoId,
      categoria,
      nota: rating,
      descricao: descricao.trim(),
      data_evento: dataEvento ? format(dataEvento, 'yyyy-MM-dd') : undefined,
      custo: custo ? parseFloat(custo) : undefined,
    };

    createRating(ratingData, {
      onSuccess: () => {
        setOpen(false);
        setRating(0);
        setCategoria('instalacao');
        setDescricao('');
        setDataEvento(undefined);
        setCusto('');
      },
    });
  };

  const resetForm = () => {
    setRating(0);
    setCategoria('instalacao');
    setDescricao('');
    setDataEvento(undefined);
    setCusto('');
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
            <Label htmlFor="data-evento">Data do Evento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="data-evento"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !dataEvento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataEvento ? format(dataEvento, "dd/MM/yyyy") : <span>Selecionar data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataEvento}
                  onSelect={setDataEvento}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="custo">Custo (R$)</Label>
            <Input
              id="custo"
              type="number"
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              placeholder="0.00"
              className="mt-1"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua experiência..."
              className="mt-1"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0 || !descricao.trim() || isCreating}
            >
              {isCreating ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}