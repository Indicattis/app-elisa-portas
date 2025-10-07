import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function Compras() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestão de Compras</h1>
          <p className="text-muted-foreground">Controle de pedidos e fornecedores</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
          <CardDescription>
            Este módulo permitirá gerenciar compras, fornecedores, pedidos e cotações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades planejadas:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Cadastro de fornecedores</li>
            <li>Pedidos de compra</li>
            <li>Cotações e comparativos</li>
            <li>Histórico de compras</li>
            <li>Controle de prazos de entrega</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
