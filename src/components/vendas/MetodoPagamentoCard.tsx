import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, X, CreditCard, Banknote, QrCode, Wallet, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface MetodoPagamento {
  tipo: 'boleto' | 'a_vista' | 'cartao_credito' | 'dinheiro' | '';
  valor: number;
  data_pagamento: Date | undefined;
  empresa_receptora_id: string;
  parcelas_cartao: number;
  parcelas_boleto: number;
  intervalo_boletos: number;
  comprovante_file: File | null;
}

export const createEmptyMetodo = (): MetodoPagamento => ({
  tipo: '',
  valor: 0,
  data_pagamento: undefined,
  empresa_receptora_id: '',
  parcelas_cartao: 1,
  parcelas_boleto: 1,
  intervalo_boletos: 30,
  comprovante_file: null
});

interface MetodoPagamentoCardProps {
  metodo: MetodoPagamento;
  onChange: (metodo: MetodoPagamento) => void;
  empresas: Array<{ id: string; nome: string }>;
  isLoadingEmpresas: boolean;
  titulo: string;
  valorFixo?: boolean;
  valorLabel?: string;
}

export function MetodoPagamentoCard({
  metodo,
  onChange,
  empresas,
  isLoadingEmpresas,
  titulo,
  valorFixo = false,
  valorLabel = "Valor *"
}: MetodoPagamentoCardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    onChange({ ...metodo, comprovante_file: file });
  };

  const handleRemoveFile = () => {
    onChange({ ...metodo, comprovante_file: null });
  };

  const metodos = [
    { value: 'boleto', label: 'Boleto', icon: QrCode },
    { value: 'a_vista', label: 'À Vista', icon: Banknote },
    { value: 'cartao_credito', label: 'Cartão', icon: CreditCard },
    { value: 'dinheiro', label: 'Dinheiro', icon: Wallet },
  ];

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <h4 className="font-medium text-sm text-muted-foreground">{titulo}</h4>
      
      {/* Seleção do tipo de pagamento */}
      <div className="grid grid-cols-4 gap-2">
        {metodos.map((m) => {
          const Icon = m.icon;
          return (
            <Button
              key={m.value}
              type="button"
              variant={metodo.tipo === m.value ? "default" : "outline"}
              className="flex flex-col h-auto py-3 gap-1"
              onClick={() => onChange({ ...metodo, tipo: m.value as MetodoPagamento['tipo'] })}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{m.label}</span>
            </Button>
          );
        })}
      </div>

      {metodo.tipo && (
        <div className="space-y-4">
          {/* Linha com Valor, Data e Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{valorLabel}</Label>
              {valorFixo ? (
                <div className="h-9 px-3 py-2 border rounded-md bg-muted text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metodo.valor)}
                </div>
              ) : (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={metodo.valor || ''}
                  onChange={(e) => onChange({ ...metodo, valor: parseFloat(e.target.value) || 0 })}
                  placeholder="R$ 0,00"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Data do Pagamento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !metodo.data_pagamento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {metodo.data_pagamento 
                      ? format(metodo.data_pagamento, "dd/MM/yyyy", { locale: ptBR }) 
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={metodo.data_pagamento}
                    onSelect={(date) => onChange({ ...metodo, data_pagamento: date })}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Empresa Receptora *</Label>
              <Select
                value={metodo.empresa_receptora_id}
                onValueChange={(value) => onChange({ ...metodo, empresa_receptora_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingEmpresas ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {metodo.tipo === 'cartao_credito' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Parcelas *</Label>
                <Select
                  value={metodo.parcelas_cartao.toString()}
                  onValueChange={(value) => onChange({ ...metodo, parcelas_cartao: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x {metodo.valor > 0 && `de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metodo.valor / n)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {metodo.tipo === 'boleto' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Parcelas *</Label>
                <Select
                  value={metodo.parcelas_boleto.toString()}
                  onValueChange={(value) => onChange({ ...metodo, parcelas_boleto: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x {metodo.valor > 0 && `de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metodo.valor / n)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Intervalo entre Boletos *</Label>
                <Select
                  value={metodo.intervalo_boletos.toString()}
                  onValueChange={(value) => onChange({ ...metodo, intervalo_boletos: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="21">21 dias</SelectItem>
                    <SelectItem value="28">28 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {metodo.tipo === 'a_vista' && (
            <div className="space-y-2">
              <Label>Comprovante de Pagamento</Label>
              {!metodo.comprovante_file ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id={`comprovante-${titulo}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById(`comprovante-${titulo}`)?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Comprovante (PNG, JPG ou PDF)
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                  <span className="text-sm flex-1 truncate">{metodo.comprovante_file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Dinheiro não precisa de campos específicos adicionais */}
        </div>
      )}
    </div>
  );
}
