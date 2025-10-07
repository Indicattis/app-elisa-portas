import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function RHAdmin() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">RH Administrativo</h1>
          <p className="text-muted-foreground">Gestão de recursos humanos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
          <CardDescription>
            Este módulo permitirá gerenciar colaboradores, folha de pagamento e benefícios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades planejadas:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Cadastro de colaboradores</li>
            <li>Controle de ponto</li>
            <li>Folha de pagamento</li>
            <li>Gestão de férias</li>
            <li>Benefícios</li>
            <li>Avaliações de desempenho</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
