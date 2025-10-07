import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Representantes() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Representantes</h1>
          <p className="text-muted-foreground">Gestão de representantes comerciais</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
          <CardDescription>
            Este módulo permitirá gerenciar representantes comerciais e suas regiões de atuação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades planejadas:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Cadastro de representantes</li>
            <li>Definição de regiões de atuação</li>
            <li>Controle de comissões</li>
            <li>Performance por representante</li>
            <li>Relatórios de vendas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
