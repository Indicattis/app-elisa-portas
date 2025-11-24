import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Venda {
  id: string;
  cliente_nome: string;
  data_venda: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
}

interface SelecionarVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (venda: Venda) => void;
  vendaSelecionada?: string | null;
}

export const SelecionarVendaModal = ({
  open,
  onOpenChange,
  onSelect,
  vendaSelecionada,
}: SelecionarVendaModalProps) => {
  const [busca, setBusca] = useState("");
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!busca.trim()) {
      toast.error("Digite um nome para buscar");
      return;
    }

    setSearching(true);
    setSearched(true);
    
    try {
      const buscaLimpa = busca.trim();
      
      const { data, error } = await supabase
        .from("vendas")
        .select("id, cliente_nome, data_venda, estado, cidade, bairro, cep")
        .ilike("cliente_nome", `%${buscaLimpa}%`)
        .order("data_venda", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setVendas(data || []);
      
      if (!data || data.length === 0) {
        toast.info("Nenhuma venda encontrada");
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      toast.error("Erro ao buscar vendas");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectVenda = (venda: Venda) => {
    onSelect(venda);
    onOpenChange(false);
    setBusca("");
    setVendas([]);
    setSearched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Buscar Venda</DialogTitle>
          <DialogDescription>
            Digite o nome do cliente para localizar a venda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome do cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              size="icon"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Resultados */}
          {searched && (
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-2">
                {vendas.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma venda encontrada
                  </div>
                ) : (
                  vendas.map((venda) => (
                    <button
                      key={venda.id}
                      onClick={() => handleSelectVenda(venda)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                        vendaSelecionada === venda.id ? "bg-accent border-primary" : ""
                      }`}
                    >
                      <div className="font-medium">{venda.cliente_nome}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Data: {new Date(venda.data_venda).toLocaleDateString("pt-BR")}
                      </div>
                      {(venda.cidade || venda.estado) && (
                        <div className="text-sm text-muted-foreground">
                          {venda.cidade && `${venda.cidade}`}
                          {venda.cidade && venda.estado && " - "}
                          {venda.estado && venda.estado}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
