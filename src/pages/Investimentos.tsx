import { useState } from "react";
import InvestmentManager from "@/components/InvestmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function Investimentos() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investimentos em Marketing</h1>
          <p className="text-muted-foreground">
            Gerencie os investimentos em canais de marketing por região
          </p>
        </div>
      </div>

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
    </div>
  );
}
