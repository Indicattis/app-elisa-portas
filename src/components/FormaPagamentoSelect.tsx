import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "parcelado", label: "Parcelado" },
  { value: "financiamento", label: "Financiamento" },
  { value: "a_vista", label: "À Vista" },
] as const;

interface FormaPagamentoSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  showLabel?: boolean;
  placeholder?: string;
  className?: string;
}

export function FormaPagamentoSelect({
  value,
  onValueChange,
  required = false,
  showLabel = true,
  placeholder = "Selecione a forma de pagamento",
  className
}: FormaPagamentoSelectProps) {
  // Mapear valores antigos para os novos
  const normalizeValue = (val: string) => {
    const mapping: Record<string, string> = {
      'avista': 'a_vista',
      'credito': 'cartao_credito',
      'debito': 'cartao_debito',
    };
    return mapping[val] || val;
  };

  const normalizedValue = normalizeValue(value);

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor="forma_pagamento">
          Forma de Pagamento {required && "*"}
        </Label>
      )}
      <Select value={normalizedValue} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="forma_pagamento">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {FORMAS_PAGAMENTO.map((forma) => (
            <SelectItem key={forma.value} value={forma.value}>
              {forma.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
