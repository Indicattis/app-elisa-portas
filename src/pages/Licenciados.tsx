import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function Licenciados() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Licenciados</h1>
          <p className="text-muted-foreground">Gestão de parceiros licenciados</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo em Desenvolvimento</CardTitle>
          <CardDescription>
            Este módulo permitirá gerenciar parceiros licenciados da marca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades planejadas:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Cadastro de licenciados</li>
            <li>Controle de contratos</li>
            <li>Acompanhamento de metas</li>
            <li>Royalties e pagamentos</li>
            <li>Relatórios de performance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
