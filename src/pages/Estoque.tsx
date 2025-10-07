import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function Estoque() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gestão de materiais e inventário</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
          <CardDescription>
            Este módulo permitirá gerenciar o estoque de materiais e produtos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades planejadas:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Cadastro de produtos e materiais</li>
            <li>Controle de entrada e saída</li>
            <li>Níveis mínimos e máximos</li>
            <li>Alertas de reposição</li>
            <li>Inventário físico</li>
            <li>Relatórios de movimentação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
