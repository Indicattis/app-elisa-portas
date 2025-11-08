import { ReactNode } from "react";
import { ProducaoSidebar } from "./ProducaoSidebar";
import { ProducaoHeader } from "./producao/ProducaoHeader";

interface ProducaoLayoutProps {
  children: ReactNode;
}

export function ProducaoLayout({ children }: ProducaoLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <ProducaoSidebar />
      <div className="flex-1 flex flex-col">
        <ProducaoHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
