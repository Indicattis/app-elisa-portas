import { ReactNode, useState } from "react";
import { PaineisSidebar } from "./PaineisSidebar";
import { PaineisHeader } from "./PaineisHeader";

interface PaineisLayoutProps {
  children: ReactNode;
}

export function PaineisLayout({ children }: PaineisLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarVisible && <PaineisSidebar />}
      <div className="flex-1 flex flex-col">
        <PaineisHeader 
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
