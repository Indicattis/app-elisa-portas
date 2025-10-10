import { useMemo } from "react";
import { Investment } from "@/hooks/useInvestments";
import InvestmentCard from "./InvestmentCard";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyInvestmentGridProps {
  investments: Investment[];
  year: number;
  loading: boolean;
  onEditMonth: (month: number) => void;
}

export default function MonthlyInvestmentGrid({
  investments,
  year,
  loading,
  onEditMonth,
}: MonthlyInvestmentGridProps) {
  const monthlyTotals = useMemo(() => {
    const totals: Record<number, any> = {};
    
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;
      const monthInvestments = investments.filter(inv => inv.mes === monthKey);
      
      const google = monthInvestments.reduce((sum, inv) => sum + (inv.investimento_google_ads || 0), 0);
      const meta = monthInvestments.reduce((sum, inv) => sum + (inv.investimento_meta_ads || 0), 0);
      const linkedin = monthInvestments.reduce((sum, inv) => sum + (inv.investimento_linkedin_ads || 0), 0);
      const outros = monthInvestments.reduce((sum, inv) => sum + (inv.outros_investimentos || 0), 0);
      
      totals[month] = {
        google,
        meta,
        linkedin,
        outros,
        total: google + meta + linkedin + outros,
        hasData: monthInvestments.length > 0
      };
    }
    
    return totals;
  }, [investments, year]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
        <InvestmentCard
          key={month}
          month={month}
          year={year}
          total={monthlyTotals[month].total}
          breakdown={{
            google: monthlyTotals[month].google,
            meta: monthlyTotals[month].meta,
            linkedin: monthlyTotals[month].linkedin,
            outros: monthlyTotals[month].outros,
          }}
          hasData={monthlyTotals[month].hasData}
          onEdit={() => onEditMonth(month)}
        />
      ))}
    </div>
  );
}
