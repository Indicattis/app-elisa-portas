import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function RHHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recursos Humanos</h1>
        <p className="text-muted-foreground mt-2">
          Gestão de pessoas e processos de RH
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/administrativo/rh/vagas")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <CardTitle>Vagas</CardTitle>
            </div>
            <CardDescription>Gerenciar vagas e processos seletivos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
