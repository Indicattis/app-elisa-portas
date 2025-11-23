import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./admin/AdminHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-2 md:p-3 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
