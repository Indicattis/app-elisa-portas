import { useState } from "react";
import { Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Venda {
  id: string;
  cliente_nome: string;
  cpf_cliente: string | null;
  cliente_email: string | null;
  cidade: string;
  estado: string;
  cep: string | null;
  bairro: string | null;
  valor_venda: number;
  forma_pagamento: string;
  data_venda: string;
  produtos_vendas: Array<{ id: string }>;
}

interface VendaSelectorProps {
  vendas: Venda[] | undefined;
  selectedVenda: string | undefined;
  onSelect: (vendaId: string) => void;
}

export function VendaSelector({ vendas, selectedVenda, onSelect }: VendaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedVendaData = vendas?.find(v => v.id === selectedVenda);

  const filteredVendas = vendas?.filter((venda) => {
    const searchLower = searchTerm.toLowerCase();
    const nomeMatch = venda.cliente_nome.toLowerCase().includes(searchLower);
    const cpfMatch = venda.cpf_cliente?.toLowerCase().includes(searchLower);
    return nomeMatch || cpfMatch;
  });

  const handleSelect = (vendaId: string) => {
    onSelect(vendaId);
    setOpen(false);
    setSearchTerm("");
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      pix: "PIX",
      parcelado: "Parcelado",
      boleto: "Boleto",
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-2">
      <Label>Selecione a Venda</Label>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {selectedVendaData ? (
              <span>
                {selectedVendaData.cliente_nome} - R${" "}
                {selectedVendaData.valor_venda.toFixed(2)}
              </span>
            ) : (
              <span className="text-muted-foreground">Selecione uma venda</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Venda</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">Qtd. Produtos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas && filteredVendas.length > 0 ? (
                  filteredVendas.map((venda) => (
                    <TableRow
                      key={venda.id}
                      className={
                        selectedVenda === venda.id
                          ? "bg-accent"
                          : "cursor-pointer hover:bg-muted/50"
                      }
                      onClick={() => handleSelect(venda.id)}
                    >
                      <TableCell className="font-medium">
                        {venda.cliente_nome}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {venda.cpf_cliente || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {venda.valor_venda.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {venda.produtos_vendas.length}
                      </TableCell>
                      <TableCell>
                        {format(new Date(venda.data_venda), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {formatPaymentMethod(venda.forma_pagamento)}
                      </TableCell>
                      <TableCell>
                        {selectedVenda === venda.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "Nenhuma venda encontrada"
                        : "Nenhuma venda disponível"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
