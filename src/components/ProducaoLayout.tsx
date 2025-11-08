import { ReactNode } from "react";
import { ProducaoSidebar } from "./ProducaoSidebar";
import { ProducaoHeader } from "./producao/ProducaoHeader";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";

interface ProducaoLayoutProps {
  children: ReactNode;
}

export function ProducaoLayout({ children }: ProducaoLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <ProducaoSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <ProducaoHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
