import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const FORMAS_PAGAMENTO = [
  { value: "a_vista", label: "À Vista" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
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
