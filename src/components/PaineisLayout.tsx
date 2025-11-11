import { ReactNode } from "react";
import { PaineisSidebar } from "./PaineisSidebar";
import { PaineisHeader } from "./PaineisHeader";

interface PaineisLayoutProps {
  children: ReactNode;
}

export function PaineisLayout({ children }: PaineisLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <PaineisSidebar />
      <div className="flex-1 flex flex-col">
        <PaineisHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
