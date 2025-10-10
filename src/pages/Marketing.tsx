import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanaisAquisicaoManager } from "@/components/CanaisAquisicaoManager";
import InvestmentManager from "@/components/InvestmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Database, TrendingUp } from "lucide-react";
import MarketingAnalise from "@/components/marketing/MarketingAnalise";

export default function Marketing() {
  const [selectedTab, setSelectedTab] = useState("analise");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing</h1>
          <p className="text-muted-foreground">
            Análise de marketing, canais de aquisição e investimentos
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analise" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Análise
          </TabsTrigger>
          <TabsTrigger value="canais" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Canais de Aquisição
          </TabsTrigger>
          <TabsTrigger value="investimentos" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Investimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analise" className="space-y-6">
          <MarketingAnalise />
        </TabsContent>

        <TabsContent value="canais" className="space-y-6">
          <CanaisAquisicaoManager />
        </TabsContent>

        <TabsContent value="investimentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Investimentos</CardTitle>
              <div className="flex items-center gap-4">
                <label htmlFor="year-select" className="text-sm font-medium">
                  Ano:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <InvestmentManager selectedYear={selectedYear} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
