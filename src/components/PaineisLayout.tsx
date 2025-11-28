import { ReactNode } from "react";
import { PaineisSidebar } from "./PaineisSidebar";
import { PaineisHeader } from "./PaineisHeader";

interface PaineisLayoutProps {
  children: ReactNode;
}

export function PaineisLayout({ children }: PaineisLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <PaineisSidebar />
      <div className="flex flex-col flex-1 min-h-screen transition-all duration-500">
        <PaineisHeader />
        <main className="flex-1 p-2 md:p-3 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
