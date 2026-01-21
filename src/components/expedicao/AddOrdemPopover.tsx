import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrdensSemDataCarregamento } from "@/hooks/useOrdensSemDataCarregamento";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AddOrdemPopoverProps {
  date: Date;
  onUpdateOrdem: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onOrdemAdded?: () => void;
  size?: "default" | "sm" | "icon";
  className?: string;
}

interface Responsavel {
  id: string;
  nome: string;
}

export const AddOrdemPopover = ({
  date,
  onUpdateOrdem,
  onOrdemAdded,
  size = "icon",
  className = "",
}: AddOrdemPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { ordens, isLoading, refetch } = useOrdensSemDataCarregamento();
  
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamento | null>(null);
  const [hora, setHora] = useState("08:00");
  const [responsavelTipo, setResponsavelTipo] = useState<'elisa' | 'autorizados' | 'terceiro'>('elisa');
  const [responsavelId, setResponsavelId] = useState("");
  const [responsavelNomeTerceiro, setResponsavelNomeTerceiro] = useState("");
  const [equipes, setEquipes] = useState<Responsavel[]>([]);
  const [autorizados, setAutorizados] = useState<Responsavel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      refetch();
      loadResponsaveis();
      // Reset state
      setSelectedOrdem(null);
      setHora("08:00");
      setResponsavelTipo('elisa');
      setResponsavelId("");
      setResponsavelNomeTerceiro("");
    }
  }, [open, refetch]);

  const loadResponsaveis = async () => {
    const [equipesRes, autorizadosRes] = await Promise.all([
      supabase.from('equipes_instalacao').select('id, nome').eq('ativa', true),
      supabase.from('autorizados').select('id, nome').eq('ativo', true)
    ]);
    setEquipes(equipesRes.data || []);
    setAutorizados(autorizadosRes.data || []);
  };

  const formatarTamanhos = (produtos?: OrdemCarregamento['venda']['produtos']) => {
    if (!produtos || produtos.length === 0) return '-';
    
    const tamanhos = produtos
      .map(p => {
        if (p.tamanho) return p.tamanho;
        if (p.largura && p.altura) return `${p.largura}x${p.altura}`;
        return null;
      })
      .filter(Boolean);
    
    if (tamanhos.length === 0) return '-';
    if (tamanhos.length === 1) return tamanhos[0];
    return `${tamanhos[0]} (+${tamanhos.length - 1})`;
  };

  const handleConfirm = async () => {
    if (!selectedOrdem) return;
    
    // Validar responsável
    if (responsavelTipo === 'terceiro' && !responsavelNomeTerceiro.trim()) {
      toast.error("Informe o nome do responsável terceiro");
      return;
    }
    if (responsavelTipo !== 'terceiro' && !responsavelId) {
      toast.error("Selecione um responsável");
      return;
    }

    setIsSubmitting(true);

    try {
      const responsavelNome = responsavelTipo === 'terceiro' 
        ? responsavelNomeTerceiro 
        : (responsavelTipo === 'elisa' ? equipes : autorizados)
            .find(r => r.id === responsavelId)?.nome || '';

      await onUpdateOrdem({
        id: selectedOrdem.id,
        data: {
          data_carregamento: format(date, "yyyy-MM-dd"),
          hora,
          tipo_carregamento: responsavelTipo,
          responsavel_carregamento_id: responsavelTipo !== 'terceiro' ? responsavelId : null,
          responsavel_carregamento_nome: responsavelNome,
          status: "agendada",
        },
      });

      toast.success("Ordem agendada com sucesso!");
      setOpen(false);
      onOrdemAdded?.();
    } catch (error) {
      console.error("Erro ao agendar ordem:", error);
      toast.error("Erro ao agendar ordem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const responsaveisAtuais = responsavelTipo === 'elisa' ? equipes : autorizados;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={size} className={className}>
          <Plus className={size === "icon" ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[650px] p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-[11px]">Adicionar Ordem</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Agendar ordem para {format(date, "dd/MM/yyyy")}
          </p>
        </div>
        
        {/* Lista de ordens */}
        <div className="max-h-[200px] overflow-y-auto border-b">
          {isLoading ? (
            <div className="p-4 text-center text-[10px] text-muted-foreground">
              Carregando...
            </div>
          ) : ordens.length === 0 ? (
            <div className="p-4 text-center text-[10px] text-muted-foreground">
              Nenhuma ordem disponível
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[2fr,1fr,1fr,1.5fr] gap-2 px-3 py-2 bg-muted/50 border-b text-[11px] font-medium">
                <div>Cliente</div>
                <div>Pedido</div>
                <div>Tamanho</div>
                <div>Localização</div>
              </div>
              <div className="divide-y">
                {ordens.map((ordem) => (
                  <button
                    key={ordem.id}
                    onClick={() => setSelectedOrdem(ordem)}
                    className={`w-full grid grid-cols-[2fr,1fr,1fr,1.5fr] gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors items-center ${
                      selectedOrdem?.id === ordem.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="text-[10px] font-medium truncate">{ordem.nome_cliente}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {ordem.pedido?.numero_pedido || '-'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {formatarTamanhos(ordem.venda?.produtos)}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {ordem.venda ? `${ordem.venda.cidade} - ${ordem.venda.estado}` : '-'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulário de agendamento */}
        {selectedOrdem && (
          <div className="p-3 space-y-3 bg-muted/20">
            <div className="text-[11px] font-medium text-primary">
              Configurar agendamento para: {selectedOrdem.nome_cliente}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Horário</Label>
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px]">Responsável *</Label>
              <RadioGroup
                value={responsavelTipo}
                onValueChange={(value) => {
                  setResponsavelTipo(value as 'elisa' | 'autorizados' | 'terceiro');
                  setResponsavelId("");
                  setResponsavelNomeTerceiro("");
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="elisa" id="elisa" className="h-3 w-3" />
                  <Label htmlFor="elisa" className="text-[10px] cursor-pointer">Elisa</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="autorizados" id="autorizados" className="h-3 w-3" />
                  <Label htmlFor="autorizados" className="text-[10px] cursor-pointer">Autorizado</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="terceiro" id="terceiro" className="h-3 w-3" />
                  <Label htmlFor="terceiro" className="text-[10px] cursor-pointer">Terceiro</Label>
                </div>
              </RadioGroup>

              {responsavelTipo === 'terceiro' ? (
                <Input
                  placeholder="Nome do terceiro"
                  value={responsavelNomeTerceiro}
                  onChange={(e) => setResponsavelNomeTerceiro(e.target.value)}
                  className="h-8 text-[11px]"
                />
              ) : (
                <Select value={responsavelId} onValueChange={setResponsavelId}>
                  <SelectTrigger className="h-8 text-[11px]">
                    <SelectValue placeholder={`Selecione ${responsavelTipo === 'elisa' ? 'a equipe' : 'o autorizado'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {responsaveisAtuais.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id} className="text-[11px]">
                        {resp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-[10px] h-7"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedOrdem || isSubmitting}
            className="text-[10px] h-7"
          >
            {isSubmitting ? "Agendando..." : "Confirmar Agenda"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
