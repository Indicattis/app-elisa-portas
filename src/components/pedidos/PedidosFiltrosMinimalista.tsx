import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PedidosFiltrosMinimalistaProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tipoEntrega: string;
  onTipoEntregaChange: (value: string) => void;
  corPintura: string;
  onCorPinturaChange: (value: string) => void;
  mostrarProntos: boolean;
  onMostrarProntosToggle: () => void;
}

export function PedidosFiltrosMinimalista({
  searchTerm,
  onSearchChange,
  tipoEntrega,
  onTipoEntregaChange,
  corPintura,
  onCorPinturaChange,
  mostrarProntos,
  onMostrarProntosToggle
}: PedidosFiltrosMinimalistaProps) {

  const { data: cores = [] } = useQuery({
    queryKey: ['cores-filtro'],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('catalogo_cores').
      select('id, nome, codigo_hex').
      eq('ativa', true).
      order('nome');

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
      {/* Pesquisa */}
      <div className="relative w-full sm:w-48">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Cliente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-xs" />
        
      </div>

      {/* Tipo de Entrega */}
      <Select value={tipoEntrega} onValueChange={onTipoEntregaChange}>
        <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
          <SelectValue placeholder="Entrega" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="instalacao">Instalação</SelectItem>
          <SelectItem value="entrega">Entrega</SelectItem>
        </SelectContent>
      </Select>

      {/* Cor da Pintura */}
      <Select value={corPintura} onValueChange={onCorPinturaChange}>
        <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
          <SelectValue placeholder="Cor" />
        </SelectTrigger>
        <SelectContent className="max-h-80 bg-background z-50">
          <SelectItem value="todas">Todas</SelectItem>
          {cores.map((cor) =>
          <SelectItem key={cor.id} value={cor.nome}>
              <div className="flex items-center gap-2">
                <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: cor.codigo_hex }} />
              
                {cor.nome}
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Botão de prontos para avançar */}
      







      
    </div>);

}