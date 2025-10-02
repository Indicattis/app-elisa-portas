import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { PortaVenda } from '@/hooks/useVendas';

interface PortasVendaTableProps {
  portas: (PortaVenda & { id?: string; cor?: { nome: string; codigo_hex: string } })[];
  onRemovePorta?: (index: number) => void;
  readOnly?: boolean;
}

export function PortasVendaTable({ portas, onRemovePorta, readOnly = false }: PortasVendaTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularValorSemFrete = (porta: PortaVenda) => {
    const valorBase = porta.valor_produto + porta.valor_pintura + porta.valor_instalacao;
    return valorBase * (1 - (porta.desconto_percentual || 0) / 100);
  };

  const calcularValorTotal = (porta: PortaVenda) => {
    return calcularValorSemFrete(porta) + porta.valor_frete;
  };

  if (portas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/50">
        Nenhuma porta adicionada
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tamanho</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead className="text-right">Vlr Produto</TableHead>
            <TableHead className="text-right">Vlr Pintura</TableHead>
            <TableHead className="text-right">Vlr Frete</TableHead>
            <TableHead className="text-right">Vlr Instalação</TableHead>
            <TableHead className="text-right">Desconto %</TableHead>
            <TableHead className="text-right">Total s/ Frete</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {!readOnly && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {portas.map((porta, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{porta.tamanho}</TableCell>
              <TableCell>
                {porta.cor ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: porta.cor.codigo_hex }}
                    />
                    {porta.cor.nome}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(porta.valor_produto)}</TableCell>
              <TableCell className="text-right">{formatCurrency(porta.valor_pintura)}</TableCell>
              <TableCell className="text-right">{formatCurrency(porta.valor_frete)}</TableCell>
              <TableCell className="text-right">{formatCurrency(porta.valor_instalacao)}</TableCell>
              <TableCell className="text-right">{porta.desconto_percentual}%</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(calcularValorSemFrete(porta))}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(calcularValorTotal(porta))}
              </TableCell>
              {!readOnly && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemovePorta?.(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
