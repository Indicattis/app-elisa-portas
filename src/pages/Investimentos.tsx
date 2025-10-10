import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import MonthlyInvestmentGrid from "@/components/investimentos/MonthlyInvestmentGrid";
import InvestmentModal from "@/components/investimentos/InvestmentModal";
import InvestmentChart from "@/components/investimentos/InvestmentChart";

export default function Investimentos() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const { investments, loading, saveInvestment } = useInvestments(selectedYear);

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
          <div className="flex items-center justify-between">
            <CardTitle>Investimentos Mensais</CardTitle>
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm font-medium">
                Ano:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm bg-background"
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
          </div>
        </CardHeader>
        <CardContent>
          <MonthlyInvestmentGrid
            investments={investments}
            year={selectedYear}
            loading={loading}
            onEditMonth={setSelectedMonth}
          />
        </CardContent>
      </Card>

      <InvestmentChart investments={investments} year={selectedYear} />

      <InvestmentModal
        open={selectedMonth !== null}
        onClose={() => setSelectedMonth(null)}
        month={selectedMonth}
        year={selectedYear}
        investments={investments}
        onSave={saveInvestment}
      />
    </div>
  );
}
