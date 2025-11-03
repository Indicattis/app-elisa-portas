import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, DollarSign, Package } from "lucide-react";

export default function VendaView() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchVendaDetails();
  }, [id]);

  const fetchVendaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      setVenda(vendaData);

      const { data: produtosData } = await supabase
        .from("produtos_vendas")
        .select(`*, cor:catalogo_cores(nome, codigo_hex)`)
        .eq("venda_id", id);
      
      setProdutos(produtosData || []);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar venda" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!venda) return <div className="text-center py-8"><p>Venda não encontrada</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/faturamento")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Voltar
        </Button>
        <h1 className="text-3xl font-bold">Detalhes da Venda</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Informações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><p className="text-2xl font-bold text-green-600">{formatCurrency(venda.valor_venda)}</p></div>
          <Separator />
          {venda.estado && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{venda.cidade}, {venda.estado}</span></div>}
        </CardContent>
      </Card>

      {produtos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-4 h-4" />Produtos</CardTitle></CardHeader>
          <CardContent>
            {produtos.map(p => (
              <div key={p.id} className="border-b py-2">
                <p className="font-medium">{p.descricao}</p>
                <p className="text-sm text-muted-foreground">Qtd: {p.quantidade} - {formatCurrency(p.valor_total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
