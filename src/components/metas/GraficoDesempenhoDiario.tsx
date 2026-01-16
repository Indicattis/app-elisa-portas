import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DesempenhoDiario } from "@/hooks/useMetasColaboradorIndividual";

interface GraficoDesempenhoDiarioProps {
  dados: DesempenhoDiario[];
  tipo: keyof Omit<DesempenhoDiario, "data" | "dia_semana">;
  titulo: string;
  cor: string;
  unidade?: string;
}

const diasSemanaMap: Record<string, string> = {
  "Mon": "Seg",
  "Tue": "Ter",
  "Wed": "Qua",
  "Thu": "Qui",
  "Fri": "Sex",
  "Sat": "Sáb",
  "Sun": "Dom",
};

export function GraficoDesempenhoDiario({
  dados,
  tipo,
  titulo,
  cor,
  unidade = "",
}: GraficoDesempenhoDiarioProps) {
  const dadosFormatados = dados.map((item) => ({
    dia: diasSemanaMap[item.dia_semana] || item.dia_semana,
    valor: Number(item[tipo]) || 0,
    dataCompleta: new Date(item.data).toLocaleDateString("pt-BR"),
  }));

  const total = dadosFormatados.reduce((acc, item) => acc + item.valor, 0);
  const temDados = total > 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{titulo}</span>
          <span className="text-xs text-muted-foreground">
            Total: {tipo.includes("metros") || tipo.includes("m2") 
              ? total.toFixed(2).replace(".", ",") 
              : total}{unidade}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {temDados ? (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFormatados} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="dia" 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    tipo.includes("metros") || tipo.includes("m2")
                      ? `${value.toFixed(2).replace(".", ",")}${unidade}`
                      : `${value}${unidade}`,
                    titulo,
                  ]}
                  labelFormatter={(label, payload) => 
                    payload[0]?.payload?.dataCompleta || label
                  }
                />
                <Bar 
                  dataKey="valor" 
                  fill={cor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
            Sem dados no período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
